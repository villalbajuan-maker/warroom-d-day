import { supabase } from '../../lib/supabase';

export interface FinalReportData {
  campaign_name: string;
  total_municipalities: number;
  total_polling_places: number;
  total_tables: number;
  tables_covered: number;
  tables_checked_in: number;
  tables_closed: number;
  e14_received: number;
  total_witnesses: number;
  witnesses_present: number;
  witnesses_absent: number;
  total_incidents: number;
  critical_incidents: number;
  high_incidents: number;
  medium_incidents: number;
  low_incidents: number;
  total_evidences: number;
  total_signals: number;
  municipalities_summary: {
    municipality_name: string;
    tables_closed: number;
    e14_received: number;
    incidents: number;
  }[];
}

export async function getFinalReport(
  campaignId: string
): Promise<FinalReportData> {
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('name')
    .eq('id', campaignId)
    .maybeSingle();

  if (campaignError) throw campaignError;

  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      id,
      municipality_id,
      polling_place_id,
      polling_table_id,
      witness_id,
      territorial_municipalities!inner (
        id,
        name
      ),
      territorial_polling_places!inner (
        id,
        name
      )
    `)
    .eq('campaign_id', campaignId);

  if (assignmentsError) throw assignmentsError;

  const municipalityIds = [...new Set(assignments?.map(a => a.municipality_id) || [])];
  const pollingPlaceIds = [...new Set(assignments?.map(a => a.polling_place_id) || [])];
  const pollingTableIds = [...new Set(assignments?.map(a => a.polling_table_id) || [])];

  const { data: allTables, error: tablesError } = await supabase
    .from('territorial_polling_tables')
    .select('id')
    .in('polling_place_id', pollingPlaceIds);

  if (tablesError) throw tablesError;

  const { data: allEvents, error: eventsError } = await supabase
    .from('demo_timeline_events')
    .select('event_type, polling_table_id, witness_id, payload')
    .eq('campaign_id', campaignId);

  if (eventsError) throw eventsError;

  const checkedInTables = new Set<string>();
  const closedTables = new Set<string>();
  const e14ReceivedTables = new Set<string>();
  const witnessStatusMap = new Map<string, 'CHECKED_IN' | 'NO_SHOW'>();
  const incidents: { severity?: string }[] = [];
  let evidenceCount = 0;
  let signalCount = 0;

  allEvents?.forEach(event => {
    switch (event.event_type) {
      case 'CHECK_IN':
        if (event.polling_table_id) checkedInTables.add(event.polling_table_id);
        if (event.witness_id) witnessStatusMap.set(event.witness_id, 'CHECKED_IN');
        break;
      case 'NO_SHOW':
        if (event.witness_id) witnessStatusMap.set(event.witness_id, 'NO_SHOW');
        break;
      case 'TABLE_CLOSE':
        if (event.polling_table_id) closedTables.add(event.polling_table_id);
        break;
      case 'E14_RECEIVED':
        if (event.polling_table_id) e14ReceivedTables.add(event.polling_table_id);
        break;
      case 'INCIDENT':
        incidents.push({ severity: event.payload?.severity });
        break;
      case 'EVIDENCE':
        evidenceCount += 1;
        break;
      case 'SIGNAL':
        signalCount += 1;
        break;
    }
  });

  const totalWitnesses = assignments?.length || 0;
  let witnessesPresent = 0;
  let witnessesAbsent = 0;

  assignments?.forEach(assignment => {
    const status = witnessStatusMap.get(assignment.witness_id);
    if (status === 'CHECKED_IN') {
      witnessesPresent += 1;
    } else if (!status || status === 'NO_SHOW') {
      witnessesAbsent += 1;
    }
  });

  const criticalIncidents = incidents.filter(
    inc => inc.severity === 'CRITICAL' || inc.severity === 'critical'
  ).length;
  const highIncidents = incidents.filter(
    inc => inc.severity === 'HIGH' || inc.severity === 'high'
  ).length;
  const mediumIncidents = incidents.filter(
    inc => inc.severity === 'MEDIUM' || inc.severity === 'medium'
  ).length;
  const lowIncidents = incidents.filter(
    inc => inc.severity === 'LOW' || inc.severity === 'low'
  ).length;

  const munSummaryMap = new Map<string, {
    municipality_name: string;
    tables_closed: Set<string>;
    e14_received: Set<string>;
    incidents: number;
  }>();

  assignments?.forEach(assignment => {
    const munId = assignment.municipality_id;
    const munName = assignment.territorial_municipalities.name;

    if (!munSummaryMap.has(munId)) {
      munSummaryMap.set(munId, {
        municipality_name: munName,
        tables_closed: new Set(),
        e14_received: new Set(),
        incidents: 0
      });
    }
  });

  allEvents?.forEach(event => {
    if (!event.polling_table_id) return;

    const assignment = assignments?.find(a => a.polling_table_id === event.polling_table_id);
    if (!assignment) return;

    const munId = assignment.municipality_id;
    const munSummary = munSummaryMap.get(munId);
    if (!munSummary) return;

    if (event.event_type === 'TABLE_CLOSE') {
      munSummary.tables_closed.add(event.polling_table_id);
    } else if (event.event_type === 'E14_RECEIVED') {
      munSummary.e14_received.add(event.polling_table_id);
    } else if (event.event_type === 'INCIDENT') {
      munSummary.incidents += 1;
    }
  });

  const municipalitiesSummary = Array.from(munSummaryMap.values()).map(mun => ({
    municipality_name: mun.municipality_name,
    tables_closed: mun.tables_closed.size,
    e14_received: mun.e14_received.size,
    incidents: mun.incidents
  })).sort((a, b) => a.municipality_name.localeCompare(b.municipality_name));

  return {
    campaign_name: campaign?.name || 'Campaña Electoral',
    total_municipalities: municipalityIds.length,
    total_polling_places: pollingPlaceIds.length,
    total_tables: allTables?.length || 0,
    tables_covered: pollingTableIds.length,
    tables_checked_in: checkedInTables.size,
    tables_closed: closedTables.size,
    e14_received: e14ReceivedTables.size,
    total_witnesses: totalWitnesses,
    witnesses_present: witnessesPresent,
    witnesses_absent: witnessesAbsent,
    total_incidents: incidents.length,
    critical_incidents: criticalIncidents,
    high_incidents: highIncidents,
    medium_incidents: mediumIncidents,
    low_incidents: lowIncidents,
    total_evidences: evidenceCount,
    total_signals: signalCount,
    municipalities_summary: municipalitiesSummary
  };
}
