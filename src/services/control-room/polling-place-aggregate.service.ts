import { supabase } from '../../lib/supabase';
import type { PollingPlaceAggregateState, PollingPlaceStatus } from '../../types/control-room-services';

export async function getPollingPlaceAggregateState(
  campaignId: string,
  currentMinute: number
): Promise<PollingPlaceAggregateState[]> {
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      polling_place_id,
      polling_table_id,
      witness_id,
      territorial_polling_places!inner (
        id,
        name
      ),
      territorial_municipalities!inner (
        name
      )
    `)
    .eq('campaign_id', campaignId);

  if (assignmentsError) throw assignmentsError;

  const pollingPlaceIds = [...new Set(assignments?.map(a => a.polling_place_id) || [])];

  const { data: allTables, error: tablesError } = await supabase
    .from('territorial_polling_tables')
    .select('id, polling_place_id')
    .in('polling_place_id', pollingPlaceIds);

  if (tablesError) throw tablesError;

  const { data: events, error: eventsError } = await supabase
    .from('demo_timeline_events')
    .select('event_type, polling_table_id, witness_id, scheduled_minute, payload')
    .eq('campaign_id', campaignId)
    .lte('scheduled_minute', currentMinute);

  if (eventsError) throw eventsError;

  const placeMap = new Map<string, {
    polling_place_name: string;
    municipality_name: string;
    total_tables: number;
    assigned_tables: Set<string>;
    checked_in_tables: Set<string>;
    closed_tables: Set<string>;
    incidents: { severity?: string }[];
    evidences: number;
    signals: number;
    no_shows: Set<string>;
  }>();

  assignments?.forEach(assignment => {
    const placeId = assignment.polling_place_id;
    if (!placeMap.has(placeId)) {
      placeMap.set(placeId, {
        polling_place_name: assignment.territorial_polling_places.name,
        municipality_name: assignment.territorial_municipalities.name,
        total_tables: 0,
        assigned_tables: new Set(),
        checked_in_tables: new Set(),
        closed_tables: new Set(),
        incidents: [],
        evidences: 0,
        signals: 0,
        no_shows: new Set()
      });
    }
    placeMap.get(placeId)!.assigned_tables.add(assignment.polling_table_id);
  });

  allTables?.forEach(table => {
    const placeId = table.polling_place_id;
    if (placeMap.has(placeId)) {
      placeMap.get(placeId)!.total_tables += 1;
    }
  });

  events?.forEach(event => {
    const tableId = event.polling_table_id;
    if (!tableId) return;

    const assignment = assignments?.find(a => a.polling_table_id === tableId);
    if (!assignment) return;

    const placeId = assignment.polling_place_id;
    const place = placeMap.get(placeId);
    if (!place) return;

    switch (event.event_type) {
      case 'CHECK_IN':
        place.checked_in_tables.add(tableId);
        place.no_shows.delete(event.witness_id);
        break;
      case 'NO_SHOW':
        place.no_shows.add(event.witness_id);
        break;
      case 'TABLE_CLOSE':
        place.closed_tables.add(tableId);
        break;
      case 'INCIDENT':
        place.incidents.push({ severity: event.payload?.severity });
        break;
      case 'EVIDENCE':
        place.evidences += 1;
        break;
      case 'SIGNAL':
        place.signals += 1;
        break;
    }
  });

  const result: PollingPlaceAggregateState[] = Array.from(placeMap.entries()).map(([placeId, data]) => {
    let status: PollingPlaceStatus = 'ok';

    if (
      data.no_shows.size > 0 ||
      data.incidents.some(inc => inc.severity === 'CRITICAL' || inc.severity === 'critical')
    ) {
      status = 'critical';
    } else if (
      data.incidents.length > 0 ||
      data.evidences > 0
    ) {
      status = 'warning';
    }

    return {
      polling_place_id: placeId,
      polling_place_name: data.polling_place_name,
      municipality_name: data.municipality_name,
      total_tables: data.total_tables,
      checked_in_tables: data.checked_in_tables.size,
      closed_tables: data.closed_tables.size,
      incidents_count: data.incidents.length,
      evidences_count: data.evidences,
      signals_count: data.signals,
      status
    };
  });

  return result.sort((a, b) => a.polling_place_name.localeCompare(b.polling_place_name));
}
