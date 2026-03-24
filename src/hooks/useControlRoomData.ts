import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  CampaignContext,
  KPIData,
  MapMarkerData,
  IncidentData,
  EvidenceData,
  RegionAlert
} from '../types/control-room';
import {
  getCampaignContext,
  getKPIData,
  getMapMarkers,
  getIncidents,
  getEvidence,
  getRegionAlerts
} from '../services/control-room-service';
import { getPollingPlaceMapDataFromEvents, type PollingPlaceMapData } from '../services/map-data-service';
import { getAllTimelineEvents, type TimelineEvent } from '../services/demo-timeline-service';

interface ControlRoomData {
  campaign: CampaignContext | null;
  kpis: KPIData | null;
  markers: MapMarkerData[];
  pollingPlaces: PollingPlaceMapData[];
  timelineEvents: TimelineEvent[];
  incidents: IncidentData[];
  evidence: EvidenceData[];
  regionAlerts: RegionAlert[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useControlRoomData(currentMinute: number | null): ControlRoomData {
  const [campaign, setCampaign] = useState<CampaignContext | null>(null);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);
  const [pollingPlaces, setPollingPlaces] = useState<PollingPlaceMapData[]>([]);
  const [allTimelineEvents, setAllTimelineEvents] = useState<TimelineEvent[]>([]);
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [evidence, setEvidence] = useState<EvidenceData[]>([]);
  const [regionAlerts, setRegionAlerts] = useState<RegionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timelineEvents = useMemo(() => {
    if (currentMinute === null) return [];
    return allTimelineEvents.filter(
      event => event.scheduled_minute <= currentMinute
    );
  }, [allTimelineEvents, currentMinute]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const campaignContext = await getCampaignContext();

      if (!campaignContext) {
        setError('No se encontró campaña activa');
        setLoading(false);
        return;
      }

      setCampaign(campaignContext);

      const allEvents = await getAllTimelineEvents(campaignContext.campaignId);
      setAllTimelineEvents(allEvents);

      const [kpiData, markersData, incidentsData, evidenceData, alertsData] = await Promise.all([
        getKPIData(campaignContext.campaignId),
        getMapMarkers(campaignContext.campaignId),
        getIncidents(campaignContext.campaignId),
        getEvidence(campaignContext.campaignId),
        getRegionAlerts(campaignContext.campaignId)
      ]);

      setKpis(kpiData);
      setMarkers(markersData);
      setIncidents(incidentsData);
      setEvidence(evidenceData);
      setRegionAlerts(alertsData);
    } catch (err) {
      console.error('Error fetching control room data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!campaign || timelineEvents.length === 0) return;

    const updatePollingPlaces = async () => {
      const pollingPlacesData = await getPollingPlaceMapDataFromEvents(campaign.campaignId, timelineEvents);
      setPollingPlaces(pollingPlacesData);
    };

    updatePollingPlaces();
  }, [campaign, timelineEvents]);

  return {
    campaign,
    kpis,
    markers,
    pollingPlaces,
    timelineEvents,
    incidents,
    evidence,
    regionAlerts,
    loading,
    error,
    refetch: fetchData
  };
}
