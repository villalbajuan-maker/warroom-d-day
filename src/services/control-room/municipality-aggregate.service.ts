import { supabase } from '../../lib/supabase';

export interface MunicipalityAggregateState {
  municipality_id: string;
  municipality_name: string;
  department_name: string;
  total_tables: number;
  tables_covered: number;
  checked_in_count: number;
  closed_count: number;
  incidents_count: number;
  critical_incidents_count: number;
  evidences_count: number;
  absent_witnesses_count: number;
  status: 'ok' | 'warning' | 'critical';
}

export async function getMunicipalityAggregateState(
  campaignId: string,
  currentMinute: number
): Promise<MunicipalityAggregateState[]> {
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      municipality_id,
      polling_place_id,
      polling_table_id,
      witness_id,
      territorial_municipalities!inner (
        id,
        name,
        department_code
      ),
      territorial_polling_places!inner (
        id,
        name
      )
    `)
    .eq('campaign_id', campaignId);

  if (assignmentsError) throw assignmentsError;

  const { data: departmentData, error: deptError } = await supabase
    .from('territorial_departments')
    .select('department_code, name');

  if (deptError) throw deptError;

  const deptMap = new Map(
    departmentData?.map(d => [d.department_code, d.name]) || []
  );

  const municipalityIds = [...new Set(assignments?.map(a => a.municipality_id) || [])];
  const pollingPlaceIds = [...new Set(assignments?.map(a => a.polling_place_id) || [])];

  const { data: allTables, error: tablesError } = await supabase
    .from('territorial_polling_tables')
    .select(`
      id,
      polling_place_id,
      territorial_polling_places!inner (
        municipality_code,
        department_code
      )
    `)
    .in('polling_place_id', pollingPlaceIds);

  if (tablesError) throw tablesError;

  const { data: events, error: eventsError } = await supabase
    .from('demo_timeline_events')
    .select('event_type, polling_table_id, witness_id, scheduled_minute, payload')
    .eq('campaign_id', campaignId)
    .lte('scheduled_minute', currentMinute);

  if (eventsError) throw eventsError;

  const munMap = new Map<string, {
    municipality_name: string;
    department_code: string;
    total_tables: number;
    assigned_tables: Set<string>;
    checked_in_tables: Set<string>;
    closed_tables: Set<string>;
    incidents: { severity?: string }[];
    evidences: number;
    absent_witnesses: Set<string>;
  }>();

  assignments?.forEach(assignment => {
    const munId = assignment.municipality_id;
    if (!munMap.has(munId)) {
      munMap.set(munId, {
        municipality_name: assignment.territorial_municipalities.name,
        department_code: assignment.territorial_municipalities.department_code,
        total_tables: 0,
        assigned_tables: new Set(),
        checked_in_tables: new Set(),
        closed_tables: new Set(),
        incidents: [],
        evidences: 0,
        absent_witnesses: new Set()
      });
    }
    munMap.get(munId)!.assigned_tables.add(assignment.polling_table_id);
  });

  allTables?.forEach(table => {
    const assignment = assignments?.find(a => a.polling_table_id === table.id);
    if (assignment) {
      const munId = assignment.municipality_id;
      if (munMap.has(munId)) {
        munMap.get(munId)!.total_tables += 1;
      }
    }
  });

  const witnessStatusMap = new Map<string, 'CHECKED_IN' | 'NO_SHOW'>();

  events?.forEach(event => {
    if (event.event_type === 'CHECK_IN') {
      witnessStatusMap.set(event.witness_id, 'CHECKED_IN');
    } else if (event.event_type === 'NO_SHOW') {
      witnessStatusMap.set(event.witness_id, 'NO_SHOW');
    }
  });

  events?.forEach(event => {
    const tableId = event.polling_table_id;
    if (!tableId) return;

    const assignment = assignments?.find(a => a.polling_table_id === tableId);
    if (!assignment) return;

    const munId = assignment.municipality_id;
    const mun = munMap.get(munId);
    if (!mun) return;

    switch (event.event_type) {
      case 'CHECK_IN':
        mun.checked_in_tables.add(tableId);
        break;
      case 'TABLE_CLOSE':
        mun.closed_tables.add(tableId);
        break;
      case 'INCIDENT':
        mun.incidents.push({ severity: event.payload?.severity });
        break;
      case 'EVIDENCE':
      case 'E14_RECEIVED':
        mun.evidences += 1;
        break;
    }
  });

  assignments?.forEach(assignment => {
    const witnessId = assignment.witness_id;
    const status = witnessStatusMap.get(witnessId);
    const munId = assignment.municipality_id;
    const mun = munMap.get(munId);

    if (mun && (!status || status === 'NO_SHOW')) {
      mun.absent_witnesses.add(witnessId);
    }
  });

  const result: MunicipalityAggregateState[] = Array.from(munMap.entries()).map(([munId, data]) => {
    let status: 'ok' | 'warning' | 'critical' = 'ok';

    const criticalIncidents = data.incidents.filter(
      inc => inc.severity === 'CRITICAL' || inc.severity === 'critical'
    ).length;

    if (data.absent_witnesses.size > 0 || criticalIncidents > 0) {
      status = 'critical';
    } else if (data.incidents.length > 0) {
      status = 'warning';
    }

    return {
      municipality_id: munId,
      municipality_name: data.municipality_name,
      department_name: deptMap.get(data.department_code) || data.department_code,
      total_tables: data.total_tables,
      tables_covered: data.assigned_tables.size,
      checked_in_count: data.checked_in_tables.size,
      closed_count: data.closed_tables.size,
      incidents_count: data.incidents.length,
      critical_incidents_count: criticalIncidents,
      evidences_count: data.evidences,
      absent_witnesses_count: data.absent_witnesses.size,
      status
    };
  });

  return result.sort((a, b) => a.municipality_name.localeCompare(b.municipality_name));
}
