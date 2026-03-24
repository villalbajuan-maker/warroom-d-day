import { supabase } from '../lib/supabase';
import type {
  CampaignContext,
  KPIData,
  MapMarkerData,
  IncidentData,
  EvidenceData,
  RegionAlert
} from '../types/control-room';

export async function getCampaignContext(): Promise<CampaignContext | null> {
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select(`
      id,
      name,
      coverage_status,
      day_d_at,
      clients!inner(name)
    `)
    .limit(1)
    .maybeSingle();

  if (campaignError || !campaign) {
    console.error('Error fetching campaign:', campaignError);
    return null;
  }

  const { data: demoState } = await supabase
    .from('demo_simulation_state')
    .select('demo_current_at')
    .eq('campaign_id', campaign.id)
    .maybeSingle();

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    clientName: (campaign.clients as any).name,
    coverageStatus: campaign.coverage_status,
    dayDAt: campaign.day_d_at,
    demoCurrentAt: demoState?.demo_current_at || null
  };
}

export async function getKPIData(campaignId: string): Promise<KPIData> {
  const { data: coverageData } = await supabase
    .from('campaign_coverage')
    .select('scope_type, scope_reference_code')
    .eq('campaign_id', campaignId);

  let totalMesas = 0;

  if (coverageData && coverageData.length > 0) {
    if (coverageData[0].scope_type === 'polling_place') {
      const placeIds = coverageData.map(c => c.scope_reference_code);
      const { count } = await supabase
        .from('territorial_polling_tables')
        .select('id', { count: 'exact', head: true })
        .in('polling_place_id', placeIds);
      totalMesas = count || 0;
    } else if (coverageData[0].scope_type === 'municipality') {
      const municipalityCodes = coverageData.map(c => c.scope_reference_code);
      const { data: places } = await supabase
        .from('territorial_polling_places')
        .select('id')
        .in('municipality_code', municipalityCodes);

      if (places && places.length > 0) {
        const placeIds = places.map(p => p.id);
        const { count } = await supabase
          .from('territorial_polling_tables')
          .select('id', { count: 'exact', head: true })
          .in('polling_place_id', placeIds);
        totalMesas = count || 0;
      }
    }
  }

  const { count: mesasCubiertas } = await supabase
    .from('assignments')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  const { count: testigosActivos } = await supabase
    .from('witnesses')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  const { count: incidenciasCount } = await supabase
    .from('demo_incident_state')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('is_active', true);

  const { count: evidenciasCount } = await supabase
    .from('demo_evidence_state')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  const { count: mesasReportando } = await supabase
    .from('demo_presence_state')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'CHECKED_IN');

  return {
    totalMesas: totalMesas || 0,
    mesasCubiertas: mesasCubiertas || 0,
    mesasSinCubrir: (totalMesas || 0) - (mesasCubiertas || 0),
    testigosActivos: testigosActivos || 0,
    incidenciasCount: incidenciasCount || 0,
    evidenciasCount: evidenciasCount || 0,
    mesasReportando: mesasReportando || 0
  };
}

export async function getMapMarkers(campaignId: string): Promise<MapMarkerData[]> {
  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      polling_table_id,
      territorial_polling_tables!inner(
        id,
        table_number,
        polling_place_id,
        territorial_polling_places!inner(
          name,
          department_code,
          municipality_code
        )
      )
    `)
    .eq('campaign_id', campaignId);

  if (!assignments || assignments.length === 0) return [];

  const pollingPlaces = assignments
    .map(a => (a.territorial_polling_tables as any)?.territorial_polling_places)
    .filter(Boolean);

  const departmentCodes = [...new Set(pollingPlaces.map((p: any) => p.department_code))];

  const { data: municipalities } = await supabase
    .from('territorial_municipalities')
    .select('department_code, municipality_code, name')
    .in('department_code', departmentCodes);

  const municipalityMap = new Map(
    municipalities?.map(m => [`${m.department_code}-${m.municipality_code}`, m.name]) || []
  );

  const tableIds = assignments.map(a => a.polling_table_id);

  const { data: incidents } = await supabase
    .from('demo_incident_state')
    .select('polling_table_id, severity')
    .eq('campaign_id', campaignId)
    .eq('is_active', true)
    .in('polling_table_id', tableIds);

  const { data: presences } = await supabase
    .from('demo_presence_state')
    .select('polling_table_id, status')
    .eq('campaign_id', campaignId)
    .in('polling_table_id', tableIds);

  const incidentMap = new Map(incidents?.map(i => [i.polling_table_id, i.severity]) || []);
  const presenceMap = new Map(presences?.map(p => [p.polling_table_id, p.status]) || []);

  const belloCenter = { lat: 6.3378, lng: -75.5564, x: 52, y: 46 };
  const barbosaCenter = { lat: 6.4391, lng: -75.3306, x: 52, y: 41 };

  return assignments.map((assignment, index) => {
    const table = assignment.territorial_polling_tables as any;
    const place = table.territorial_polling_places;
    const municipalityName = municipalityMap.get(`${place.department_code}-${place.municipality_code}`) || '';

    const isBello = municipalityName.includes('Bello');
    const center = isBello ? belloCenter : barbosaCenter;

    const offset = (index % 3) - 1;
    const x = center.x + offset * 1.5;
    const y = center.y + (Math.floor(index / 3) - 1) * 1.5;

    const severity = incidentMap.get(assignment.polling_table_id);
    const presence = presenceMap.get(assignment.polling_table_id);

    let status: MapMarkerData['status'] = 'sin-reporte';

    if (presence === 'CHECKED_IN') {
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        status = 'critica';
      } else if (severity === 'MEDIUM') {
        status = 'alerta';
      } else {
        status = 'operando';
      }
    }

    return {
      id: table.id,
      municipio: municipalityName,
      puesto: place.name,
      mesa: `Mesa ${String(table.table_number).padStart(3, '0')}`,
      tableNumber: table.table_number,
      status,
      lat: center.lat,
      lng: center.lng,
      x,
      y
    };
  });
}

export async function getIncidents(campaignId: string): Promise<IncidentData[]> {
  const { data: incidents } = await supabase
    .from('demo_incident_state')
    .select(`
      id,
      incident_type,
      severity,
      occurred_at,
      message,
      polling_table_id,
      territorial_polling_tables!inner(
        table_number,
        territorial_polling_places!inner(
          name,
          department_code,
          municipality_code
        )
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('is_active', true)
    .order('occurred_at', { ascending: false });

  if (!incidents || incidents.length === 0) return [];

  const pollingPlaces = incidents
    .map(i => (i.territorial_polling_tables as any)?.territorial_polling_places)
    .filter(Boolean);

  const departmentCodes = [...new Set(pollingPlaces.map((p: any) => p.department_code))];

  const { data: municipalities } = await supabase
    .from('territorial_municipalities')
    .select('department_code, municipality_code, name')
    .in('department_code', departmentCodes);

  const municipalityMap = new Map(
    municipalities?.map(m => [`${m.department_code}-${m.municipality_code}`, m.name]) || []
  );

  return incidents.map(incident => {
    const table = incident.territorial_polling_tables as any;
    const place = table.territorial_polling_places;
    const municipalityName = municipalityMap.get(`${place.department_code}-${place.municipality_code}`) || '';

    return {
      id: incident.id,
      hora: new Date(incident.occurred_at).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      tipo: incident.message || incident.incident_type,
      mesa: `Mesa ${String(table.table_number).padStart(3, '0')}`,
      puesto: place.name,
      municipio: municipalityName,
      severidad: incident.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      timestamp: new Date(incident.occurred_at)
    };
  });
}

export async function getEvidence(campaignId: string): Promise<EvidenceData[]> {
  const { data: evidence } = await supabase
    .from('demo_evidence_state')
    .select(`
      id,
      evidence_type,
      file_url,
      uploaded_at,
      polling_table_id,
      territorial_polling_tables!inner(
        table_number,
        territorial_polling_places!inner(
          name,
          department_code,
          municipality_code
        )
      )
    `)
    .eq('campaign_id', campaignId)
    .order('uploaded_at', { ascending: false });

  if (!evidence || evidence.length === 0) return [];

  const pollingPlaces = evidence
    .map(e => (e.territorial_polling_tables as any)?.territorial_polling_places)
    .filter(Boolean);

  const departmentCodes = [...new Set(pollingPlaces.map((p: any) => p.department_code))];

  const { data: municipalities } = await supabase
    .from('territorial_municipalities')
    .select('department_code, municipality_code, name')
    .in('department_code', departmentCodes);

  const municipalityMap = new Map(
    municipalities?.map(m => [`${m.department_code}-${m.municipality_code}`, m.name]) || []
  );

  return evidence.map(ev => {
    const table = ev.territorial_polling_tables as any;
    const place = table.territorial_polling_places;
    const municipalityName = municipalityMap.get(`${place.department_code}-${place.municipality_code}`) || '';

    return {
      id: ev.id,
      mesa: `Mesa ${String(table.table_number).padStart(3, '0')}`,
      puesto: place.name,
      municipio: municipalityName,
      hora: new Date(ev.uploaded_at).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      imageUrl: ev.file_url,
      evidenceType: ev.evidence_type
    };
  });
}

export async function getRegionAlerts(campaignId: string): Promise<RegionAlert[]> {
  const { data: incidents } = await supabase
    .from('demo_incident_state')
    .select(`
      id,
      polling_table_id,
      territorial_polling_tables!inner(
        territorial_polling_places!inner(
          department_code,
          municipality_code
        )
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('is_active', true);

  if (!incidents || incidents.length === 0) return [];

  const pollingPlaces = incidents
    .map(i => (i.territorial_polling_tables as any)?.territorial_polling_places)
    .filter(Boolean);

  const departmentCodes = [...new Set(pollingPlaces.map((p: any) => p.department_code))];

  const { data: municipalities } = await supabase
    .from('territorial_municipalities')
    .select('department_code, municipality_code, name')
    .in('department_code', departmentCodes);

  const municipalityMap = new Map(
    municipalities?.map(m => [`${m.department_code}-${m.municipality_code}`, m.name]) || []
  );

  const municipalityCountMap = new Map<string, number>();

  incidents.forEach(incident => {
    const table = incident.territorial_polling_tables as any;
    const place = table.territorial_polling_places;
    const municipalityName = municipalityMap.get(`${place.department_code}-${place.municipality_code}`) || '';

    if (municipalityName) {
      municipalityCountMap.set(municipalityName, (municipalityCountMap.get(municipalityName) || 0) + 1);
    }
  });

  return Array.from(municipalityCountMap.entries())
    .map(([municipio, count]) => ({
      municipio,
      incidenciasCount: count
    }))
    .filter(r => r.incidenciasCount > 0)
    .sort((a, b) => b.incidenciasCount - a.incidenciasCount);
}
