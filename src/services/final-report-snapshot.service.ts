import { supabase } from '../lib/supabase';

export interface FinalReportSnapshot {
  id: string;
  campaign_id: string;
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
  generated_at: string;
  created_at: string;
}

function parsePercentageFromLabel(label: string): number | null {
  const percentMatch = label.match(/(\d+)%/);
  return percentMatch ? parseInt(percentMatch[1], 10) : null;
}

export async function generateFinalReportSnapshot(
  campaignId: string
): Promise<FinalReportSnapshot> {
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
    .select('event_type, polling_table_id, witness_id, payload, scheduled_minute')
    .eq('campaign_id', campaignId)
    .order('scheduled_minute', { ascending: true });

  if (eventsError) throw eventsError;

  const checkedInTables = new Set<string>();
  const closedTables = new Set<string>();
  const e14ReceivedTables = new Set<string>();
  const witnessStatusMap = new Map<string, 'CHECKED_IN' | 'NO_SHOW'>();
  const incidents: { severity?: string }[] = [];
  let evidenceCount = 0;
  let signalCount = 0;
  let checkInCount = 0;

  let testigos_presentes_percent: number | null = null;
  let mesas_cerradas_percent: number | null = null;
  let e14_recibidos_percent: number | null = null;

  allEvents?.forEach(event => {
    switch (event.event_type) {
      case 'SIGNAL': {
        signalCount += 1;
        const label = event.payload?.ui_label || '';
        const percent = parsePercentageFromLabel(label);

        if (label.toLowerCase().includes('testigos') &&
            (label.toLowerCase().includes('check-in') ||
             label.toLowerCase().includes('operando') ||
             label.toLowerCase().includes('presentes'))) {
          if (percent !== null) {
            testigos_presentes_percent = percent;
          }
        } else if (label.toLowerCase().includes('mesas cerradas') ||
                   label.toLowerCase().includes('mesas con testigo cerradas')) {
          if (percent !== null) {
            mesas_cerradas_percent = percent;
          }
        } else if (label.toLowerCase().includes('e14') ||
                   label.toLowerCase().includes('formularios')) {
          if (percent !== null) {
            e14_recibidos_percent = percent;
          }
        }
        break;
      }
      case 'CHECK_IN':
        checkInCount += 1;
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
    }
  });

  const totalWitnesses = assignments?.length || 0;
  const tablesCovered = pollingTableIds.length;

  let witnessesPresent: number;
  if (testigos_presentes_percent !== null && tablesCovered > 0) {
    witnessesPresent = Math.round((testigos_presentes_percent / 100) * tablesCovered);
  } else if (checkInCount > 0) {
    witnessesPresent = checkInCount;
  } else {
    witnessesPresent = 0;
  }

  let tablesClosedCount: number;
  if (mesas_cerradas_percent !== null && tablesCovered > 0) {
    tablesClosedCount = Math.round((mesas_cerradas_percent / 100) * tablesCovered);
  } else {
    tablesClosedCount = closedTables.size;
  }

  let e14ReceivedCount: number;
  if (e14_recibidos_percent !== null && tablesCovered > 0) {
    e14ReceivedCount = Math.round((e14_recibidos_percent / 100) * tablesCovered);
  } else {
    e14ReceivedCount = e14ReceivedTables.size;
  }

  const witnessesAbsent = totalWitnesses - witnessesPresent;

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
    tables_count: number;
    tables_closed: number;
    e14_received: number;
    incidents: number;
  }>();

  assignments?.forEach(assignment => {
    const munId = assignment.municipality_id;
    const munName = assignment.territorial_municipalities.name;

    if (!munSummaryMap.has(munId)) {
      munSummaryMap.set(munId, {
        municipality_name: munName,
        tables_count: 0,
        tables_closed: 0,
        e14_received: 0,
        incidents: 0
      });
    }
    const munSummary = munSummaryMap.get(munId)!;
    munSummary.tables_count += 1;
  });

  allEvents?.forEach(event => {
    if (event.event_type === 'INCIDENT') {
      const tableId = event.polling_table_id;
      if (tableId) {
        const assignment = assignments?.find(a => a.polling_table_id === tableId);
        if (assignment) {
          const munId = assignment.municipality_id;
          const munSummary = munSummaryMap.get(munId);
          if (munSummary) {
            munSummary.incidents += 1;
          }
        }
      }
    }
  });

  munSummaryMap.forEach((munSummary, munId) => {
    if (mesas_cerradas_percent !== null) {
      munSummary.tables_closed = Math.round((mesas_cerradas_percent / 100) * munSummary.tables_count);
    }
    if (e14_recibidos_percent !== null) {
      munSummary.e14_received = Math.round((e14_recibidos_percent / 100) * munSummary.tables_count);
    }
  });

  const municipalitiesSummary = Array.from(munSummaryMap.values()).map(mun => ({
    municipality_name: mun.municipality_name,
    tables_closed: mun.tables_closed,
    e14_received: mun.e14_received,
    incidents: mun.incidents
  })).sort((a, b) => a.municipality_name.localeCompare(b.municipality_name));

  const snapshotData = {
    campaign_id: campaignId,
    campaign_name: campaign?.name || 'Campaña Electoral',
    total_municipalities: municipalityIds.length,
    total_polling_places: pollingPlaceIds.length,
    total_tables: allTables?.length || 0,
    tables_covered: tablesCovered,
    tables_checked_in: witnessesPresent,
    tables_closed: tablesClosedCount,
    e14_received: e14ReceivedCount,
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

  const { data: existingSnapshot, error: checkError } = await supabase
    .from('demo_final_report_snapshot')
    .select('id')
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (checkError) throw checkError;

  let snapshot: FinalReportSnapshot;

  if (existingSnapshot) {
    const { data: updatedSnapshot, error: updateError } = await supabase
      .from('demo_final_report_snapshot')
      .update(snapshotData)
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (updateError) throw updateError;
    snapshot = updatedSnapshot as FinalReportSnapshot;
  } else {
    const { data: newSnapshot, error: insertError } = await supabase
      .from('demo_final_report_snapshot')
      .insert(snapshotData)
      .select()
      .single();

    if (insertError) throw insertError;
    snapshot = newSnapshot as FinalReportSnapshot;
  }

  return snapshot;
}

export async function getFinalReportSnapshot(
  campaignId: string
): Promise<FinalReportSnapshot | null> {
  const { data, error } = await supabase
    .from('demo_final_report_snapshot')
    .select('*')
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error) throw error;
  return data as FinalReportSnapshot | null;
}

export async function hasSnapshot(campaignId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('demo_final_report_snapshot')
    .select('id')
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function regenerateSnapshot(campaignId: string): Promise<FinalReportSnapshot> {
  const { error: deleteError } = await supabase
    .from('demo_final_report_snapshot')
    .delete()
    .eq('campaign_id', campaignId);

  if (deleteError) throw deleteError;

  return await generateFinalReportSnapshot(campaignId);
}
