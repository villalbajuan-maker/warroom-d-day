import { supabase } from '../../lib/supabase';
import type { PollingTableState } from '../../types/control-room-services';

export async function getPollingTablesState(
  campaignId: string,
  currentMinute: number
): Promise<PollingTableState[]> {
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      polling_table_id,
      witness_id,
      witnesses!inner (
        id,
        full_name
      ),
      territorial_polling_tables!inner (
        id,
        table_number
      ),
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

  const { data: events, error: eventsError } = await supabase
    .from('demo_timeline_events')
    .select('event_type, polling_table_id, scheduled_minute')
    .eq('campaign_id', campaignId)
    .lte('scheduled_minute', currentMinute);

  if (eventsError) throw eventsError;

  const tableStateMap = new Map<string, {
    checked_in: boolean;
    closed: boolean;
    e14_received: boolean;
    incidents_count: number;
    evidences_count: number;
  }>();

  assignments?.forEach(assignment => {
    const tableId = assignment.polling_table_id;
    if (!tableStateMap.has(tableId)) {
      tableStateMap.set(tableId, {
        checked_in: false,
        closed: false,
        e14_received: false,
        incidents_count: 0,
        evidences_count: 0
      });
    }
  });

  events?.forEach(event => {
    const tableId = event.polling_table_id;
    if (!tableId) return;

    const state = tableStateMap.get(tableId);
    if (!state) return;

    switch (event.event_type) {
      case 'CHECK_IN':
        state.checked_in = true;
        break;
      case 'TABLE_CLOSE':
        state.closed = true;
        break;
      case 'E14_RECEIVED':
        state.e14_received = true;
        break;
      case 'INCIDENT':
        state.incidents_count += 1;
        break;
      case 'EVIDENCE':
        state.evidences_count += 1;
        break;
    }
  });

  const result: PollingTableState[] = assignments?.map(assignment => {
    const tableId = assignment.polling_table_id;
    const state = tableStateMap.get(tableId) || {
      checked_in: false,
      closed: false,
      e14_received: false,
      incidents_count: 0,
      evidences_count: 0
    };

    return {
      polling_table_id: tableId,
      table_number: assignment.territorial_polling_tables.table_number,
      polling_place_name: assignment.territorial_polling_places.name,
      municipality_name: assignment.territorial_municipalities.name,
      witness_name: assignment.witnesses.full_name,
      checked_in: state.checked_in,
      closed: state.closed,
      e14_received: state.e14_received,
      incidents_count: state.incidents_count,
      evidences_count: state.evidences_count
    };
  }) || [];

  return result.sort((a, b) => {
    const munCompare = a.municipality_name.localeCompare(b.municipality_name);
    if (munCompare !== 0) return munCompare;
    const placeCompare = a.polling_place_name.localeCompare(b.polling_place_name);
    if (placeCompare !== 0) return placeCompare;
    return a.table_number - b.table_number;
  });
}
