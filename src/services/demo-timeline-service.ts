import { supabase } from '../lib/supabase';

export interface TimelineEvent {
  id: string;
  event_type: 'CHECK_IN' | 'NO_SHOW' | 'INCIDENT' | 'EVIDENCE' | 'SIGNAL' | 'TABLE_CLOSE' | 'E14_RECEIVED';
  scheduled_at: string;
  scheduled_minute: number;
  polling_table_id: string | null;
  witness_id: string | null;
  payload: {
    ui_label?: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message?: string;
    incident_type?: string;
    file_url?: string;
    evidence_type?: string;
    [key: string]: any;
  };
  polling_table?: {
    table_number: number;
    polling_place: {
      name: string;
      municipality: {
        name: string;
      };
    };
  };
  witness?: {
    full_name: string;
  };
}

export async function getVisibleTimelineEvents(
  campaignId: string,
  currentSimulatedTime: string
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('demo_timeline_events')
    .select(`
      id,
      event_type,
      scheduled_at,
      scheduled_minute,
      polling_table_id,
      witness_id,
      payload,
      territorial_polling_tables(
        table_number,
        territorial_polling_places(
          name,
          department_code,
          municipality_code
        )
      ),
      witnesses(full_name)
    `)
    .eq('campaign_id', campaignId)
    .lte('scheduled_at', currentSimulatedTime)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching timeline events:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const pollingPlaces = data
    .map(event => (event.territorial_polling_tables as any)?.territorial_polling_places)
    .filter(Boolean);

  const departmentCodes = [...new Set(pollingPlaces.map((p: any) => p.department_code))];

  const { data: municipalities } = await supabase
    .from('territorial_municipalities')
    .select('department_code, municipality_code, name')
    .in('department_code', departmentCodes);

  const municipalityMap = new Map(
    municipalities?.map(m => [`${m.department_code}-${m.municipality_code}`, m.name]) || []
  );

  return data.map(event => ({
    id: event.id,
    event_type: event.event_type as TimelineEvent['event_type'],
    scheduled_at: event.scheduled_at,
    scheduled_minute: event.scheduled_minute,
    polling_table_id: event.polling_table_id,
    witness_id: event.witness_id,
    payload: event.payload || {},
    polling_table: event.territorial_polling_tables ? {
      table_number: (event.territorial_polling_tables as any).table_number,
      polling_place: {
        name: (event.territorial_polling_tables as any).territorial_polling_places.name,
        municipality: {
          name: municipalityMap.get(
            `${(event.territorial_polling_tables as any).territorial_polling_places.department_code}-${(event.territorial_polling_tables as any).territorial_polling_places.municipality_code}`
          ) || ''
        }
      }
    } : undefined,
    witness: event.witnesses ? { full_name: (event.witnesses as any).full_name } : undefined
  }));
}

export async function getAllTimelineEvents(campaignId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('demo_timeline_events')
    .select(`
      id,
      event_type,
      scheduled_at,
      scheduled_minute,
      polling_table_id,
      witness_id,
      payload,
      territorial_polling_tables(
        table_number,
        territorial_polling_places(
          name,
          department_code,
          municipality_code
        )
      ),
      witnesses(full_name)
    `)
    .eq('campaign_id', campaignId)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching all timeline events:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const pollingPlaces = data
    .map(event => (event.territorial_polling_tables as any)?.territorial_polling_places)
    .filter(Boolean);

  const departmentCodes = [...new Set(pollingPlaces.map((p: any) => p.department_code))];

  const { data: municipalities } = await supabase
    .from('territorial_municipalities')
    .select('department_code, municipality_code, name')
    .in('department_code', departmentCodes);

  const municipalityMap = new Map(
    municipalities?.map(m => [`${m.department_code}-${m.municipality_code}`, m.name]) || []
  );

  return data.map(event => ({
    id: event.id,
    event_type: event.event_type as TimelineEvent['event_type'],
    scheduled_at: event.scheduled_at,
    scheduled_minute: event.scheduled_minute,
    polling_table_id: event.polling_table_id,
    witness_id: event.witness_id,
    payload: event.payload || {},
    polling_table: event.territorial_polling_tables ? {
      table_number: (event.territorial_polling_tables as any).table_number,
      polling_place: {
        name: (event.territorial_polling_tables as any).territorial_polling_places.name,
        municipality: {
          name: municipalityMap.get(
            `${(event.territorial_polling_tables as any).territorial_polling_places.department_code}-${(event.territorial_polling_tables as any).territorial_polling_places.municipality_code}`
          ) || ''
        }
      }
    } : undefined,
    witness: event.witnesses ? { full_name: (event.witnesses as any).full_name } : undefined
  }));
}

export function deriveTableStates(events: TimelineEvent[]): Map<string, {
  status: 'empty' | 'assigned' | 'active' | 'incident' | 'closed' | 'reported';
  latestEvent: TimelineEvent;
}> {
  const tableStates = new Map();

  events.forEach(event => {
    if (!event.polling_table_id) return;

    const tableId = event.polling_table_id;
    const currentState = tableStates.get(tableId);

    let newStatus: 'empty' | 'assigned' | 'active' | 'incident' | 'closed' | 'reported' = 'assigned';

    switch (event.event_type) {
      case 'CHECK_IN':
        newStatus = 'active';
        break;
      case 'NO_SHOW':
        newStatus = 'empty';
        break;
      case 'INCIDENT':
        newStatus = 'incident';
        break;
      case 'TABLE_CLOSE':
        newStatus = 'closed';
        break;
      case 'E14_RECEIVED':
        newStatus = 'reported';
        break;
    }

    if (!currentState || event.scheduled_at >= currentState.latestEvent.scheduled_at) {
      tableStates.set(tableId, {
        status: newStatus,
        latestEvent: event
      });
    }
  });

  return tableStates;
}

export function computeMetricsFromEvents(events: TimelineEvent[], totalTables: number) {
  const tableStates = deriveTableStates(events);

  let tablesActive = 0;
  let tablesWithIncident = 0;
  let tablesClosed = 0;
  let tablesReported = 0;
  let incidentsByLevel = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0
  };

  tableStates.forEach((state) => {
    switch (state.status) {
      case 'active':
        tablesActive++;
        break;
      case 'incident':
        tablesWithIncident++;
        break;
      case 'closed':
        tablesClosed++;
        break;
      case 'reported':
        tablesReported++;
        break;
    }
  });

  events.forEach(event => {
    if (event.event_type === 'INCIDENT' && event.payload.severity) {
      incidentsByLevel[event.payload.severity as keyof typeof incidentsByLevel]++;
    }
  });

  const totalIncidents = incidentsByLevel.LOW + incidentsByLevel.MEDIUM + incidentsByLevel.HIGH + incidentsByLevel.CRITICAL;

  return {
    tablesActive,
    tablesWithIncident,
    tablesClosed,
    tablesReported,
    totalIncidents,
    incidentsByLevel
  };
}
