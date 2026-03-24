import { supabase } from '../lib/supabase';
import { deriveTableStates, type TimelineEvent } from './demo-timeline-service';

export interface PollingPlaceMapData {
  polling_place_id: string;
  polling_place_name: string;
  municipality_name: string;
  total_tables: number;
  tables_with_witness: number;
  tables_checked_in: number;
  incident_count: number;
  latitude: number | null;
  longitude: number | null;
  status: 'empty' | 'assigned' | 'active' | 'incident';
}

export async function getPollingPlaceMapDataFromEvents(
  campaignId: string,
  timelineEvents: TimelineEvent[]
): Promise<PollingPlaceMapData[]> {
  const tableStates = deriveTableStates(timelineEvents);

  const { data: coverageData } = await supabase
    .from('campaign_coverage')
    .select('scope_type, scope_reference_code')
    .eq('campaign_id', campaignId);

  if (!coverageData || coverageData.length === 0) {
    return [];
  }

  let pollingPlaceIds: string[] = [];

  if (coverageData[0].scope_type === 'polling_place') {
    pollingPlaceIds = coverageData.map(c => c.scope_reference_code);
  } else if (coverageData[0].scope_type === 'municipality') {
    const municipalityCodes = coverageData.map(c => c.scope_reference_code);
    const { data: places } = await supabase
      .from('territorial_polling_places')
      .select('id')
      .in('municipality_code', municipalityCodes);

    if (places) {
      pollingPlaceIds = places.map(p => p.id);
    }
  }

  if (pollingPlaceIds.length === 0) {
    return [];
  }

  const { data: pollingPlaces } = await supabase
    .from('territorial_polling_places')
    .select('id, name, department_code, municipality_code')
    .in('id', pollingPlaceIds);

  if (!pollingPlaces) {
    return [];
  }

  const { data: municipalities } = await supabase
    .from('territorial_municipalities')
    .select('department_code, municipality_code, name')
    .in('department_code', [...new Set(pollingPlaces.map(p => p.department_code))]);

  const municipalityMap = new Map(
    municipalities?.map(m => [`${m.department_code}-${m.municipality_code}`, m.name]) || []
  );

  const { data: tablesData } = await supabase
    .from('territorial_polling_tables')
    .select('id, polling_place_id')
    .in('polling_place_id', pollingPlaceIds);

  const { data: assignmentsData } = await supabase
    .from('assignments')
    .select('polling_place_id')
    .eq('campaign_id', campaignId)
    .in('polling_place_id', pollingPlaceIds);

  const placeTablesMap = new Map<string, string[]>();
  tablesData?.forEach(table => {
    if (!placeTablesMap.has(table.polling_place_id)) {
      placeTablesMap.set(table.polling_place_id, []);
    }
    placeTablesMap.get(table.polling_place_id)!.push(table.id);
  });

  const placeAssignmentsMap = new Map<string, number>();
  assignmentsData?.forEach(assignment => {
    placeAssignmentsMap.set(
      assignment.polling_place_id,
      (placeAssignmentsMap.get(assignment.polling_place_id) || 0) + 1
    );
  });

  const belloCoords = { lat: 6.3378, lng: -75.5564 };
  const barbosaCoords = { lat: 6.4391, lng: -75.3306 };

  return pollingPlaces.map(place => {
    const tableIds = placeTablesMap.get(place.id) || [];
    const totalTables = tableIds.length;
    const tablesWithWitness = placeAssignmentsMap.get(place.id) || 0;

    let tablesCheckedIn = 0;
    let incidentCount = 0;
    let hasIncident = false;

    tableIds.forEach(tableId => {
      const state = tableStates.get(tableId);
      if (state) {
        if (state.status === 'active' || state.status === 'closed' || state.status === 'reported') {
          tablesCheckedIn++;
        }
        if (state.status === 'incident') {
          incidentCount++;
          hasIncident = true;
        }
      }
    });

    const municipality = municipalityMap.get(`${place.department_code}-${place.municipality_code}`) || '';
    const isBello = municipality.toUpperCase().includes('BELLO');
    const coords = isBello ? belloCoords : barbosaCoords;

    const offset = Math.random() * 0.01 - 0.005;

    let status: PollingPlaceMapData['status'] = 'empty';
    if (hasIncident) {
      status = 'incident';
    } else if (tablesCheckedIn > 0) {
      status = 'active';
    } else if (tablesWithWitness > 0) {
      status = 'assigned';
    }

    return {
      polling_place_id: place.id,
      polling_place_name: place.name,
      municipality_name: municipality,
      total_tables: totalTables,
      tables_with_witness: tablesWithWitness,
      tables_checked_in: tablesCheckedIn,
      incident_count: incidentCount,
      latitude: coords.lat + offset,
      longitude: coords.lng + offset,
      status
    };
  }).filter(place => place.latitude !== null && place.longitude !== null);
}

export async function getPollingPlaceMapData(campaignId: string): Promise<PollingPlaceMapData[]> {
  const { data: coverageData } = await supabase
    .from('campaign_coverage')
    .select('scope_type, scope_reference_code')
    .eq('campaign_id', campaignId);

  if (!coverageData || coverageData.length === 0) {
    return [];
  }

  let pollingPlaceIds: string[] = [];

  if (coverageData[0].scope_type === 'polling_place') {
    pollingPlaceIds = coverageData.map(c => c.scope_reference_code);
  } else if (coverageData[0].scope_type === 'municipality') {
    const municipalityCodes = coverageData.map(c => c.scope_reference_code);
    const { data: places } = await supabase
      .from('territorial_polling_places')
      .select('id')
      .in('municipality_code', municipalityCodes);

    if (places) {
      pollingPlaceIds = places.map(p => p.id);
    }
  }

  if (pollingPlaceIds.length === 0) {
    return [];
  }

  const { data: pollingPlaces } = await supabase
    .from('territorial_polling_places')
    .select('id, name, department_code, municipality_code')
    .in('id', pollingPlaceIds);

  if (!pollingPlaces) {
    return [];
  }

  const { data: municipalities } = await supabase
    .from('territorial_municipalities')
    .select('department_code, municipality_code, name')
    .in('department_code', [...new Set(pollingPlaces.map(p => p.department_code))]);

  const municipalityMap = new Map(
    municipalities?.map(m => [`${m.department_code}-${m.municipality_code}`, m.name]) || []
  );

  const { data: tablesData } = await supabase
    .from('territorial_polling_tables')
    .select('id, polling_place_id')
    .in('polling_place_id', pollingPlaceIds);

  const { data: assignmentsData } = await supabase
    .from('assignments')
    .select('polling_place_id')
    .eq('campaign_id', campaignId)
    .in('polling_place_id', pollingPlaceIds);

  const { data: presenceData } = await supabase
    .from('demo_presence_state')
    .select('polling_table_id')
    .eq('campaign_id', campaignId)
    .eq('status', 'CHECKED_IN');

  const { data: incidentsData } = await supabase
    .from('demo_incident_state')
    .select('polling_table_id')
    .eq('campaign_id', campaignId)
    .eq('is_active', true);

  const presenceTableIds = new Set(presenceData?.map(p => p.polling_table_id) || []);
  const incidentTableIds = new Set(incidentsData?.map(i => i.polling_table_id) || []);

  const placeTablesMap = new Map<string, string[]>();
  tablesData?.forEach(table => {
    if (!placeTablesMap.has(table.polling_place_id)) {
      placeTablesMap.set(table.polling_place_id, []);
    }
    placeTablesMap.get(table.polling_place_id)!.push(table.id);
  });

  const placeAssignmentsMap = new Map<string, number>();
  assignmentsData?.forEach(assignment => {
    placeAssignmentsMap.set(
      assignment.polling_place_id,
      (placeAssignmentsMap.get(assignment.polling_place_id) || 0) + 1
    );
  });

  const belloCoords = { lat: 6.3378, lng: -75.5564 };
  const barbosaCoords = { lat: 6.4391, lng: -75.3306 };

  return pollingPlaces.map(place => {
    const tableIds = placeTablesMap.get(place.id) || [];
    const totalTables = tableIds.length;
    const tablesWithWitness = placeAssignmentsMap.get(place.id) || 0;

    const tablesCheckedIn = tableIds.filter(tableId => presenceTableIds.has(tableId)).length;
    const incidentCount = tableIds.filter(tableId => incidentTableIds.has(tableId)).length;

    const municipality = municipalityMap.get(`${place.department_code}-${place.municipality_code}`) || '';
    const isBello = municipality.toUpperCase().includes('BELLO');
    const coords = isBello ? belloCoords : barbosaCoords;

    const offset = Math.random() * 0.01 - 0.005;

    let status: PollingPlaceMapData['status'] = 'empty';
    if (incidentCount > 0) {
      status = 'incident';
    } else if (tablesCheckedIn > 0) {
      status = 'active';
    } else if (tablesWithWitness > 0) {
      status = 'assigned';
    }

    return {
      polling_place_id: place.id,
      polling_place_name: place.name,
      municipality_name: municipality,
      total_tables: totalTables,
      tables_with_witness: tablesWithWitness,
      tables_checked_in: tablesCheckedIn,
      incident_count: incidentCount,
      latitude: coords.lat + offset,
      longitude: coords.lng + offset,
      status
    };
  }).filter(place => place.latitude !== null && place.longitude !== null);
}

export function toGeoJSON(places: PollingPlaceMapData[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map(place => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [place.longitude!, place.latitude!]
      },
      properties: {
        polling_place_id: place.polling_place_id,
        polling_place_name: place.polling_place_name,
        municipality_name: place.municipality_name,
        total_tables: place.total_tables,
        tables_with_witness: place.tables_with_witness,
        tables_checked_in: place.tables_checked_in,
        incident_count: place.incident_count,
        status: place.status
      }
    }))
  };
}
