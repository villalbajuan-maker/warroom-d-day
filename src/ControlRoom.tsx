import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, Loader2, FileCheck, Map } from 'lucide-react';
import { useDemoSimulationState } from './hooks/useDemoSimulationState';
import { useMunicipalitiesInScope } from './hooks/useMunicipalitiesInScope';
import { useAbsentWitnesses } from './hooks/useAbsentWitnesses';
import { usePollingPlaceAggregate } from './hooks/usePollingPlaceAggregate';
import { useFinalReport } from './hooks/useFinalReport';
import { usePresenterAutoPlay } from './hooks/usePresenterAutoPlay';
import { useDerivedDemoState } from './hooks/useDerivedDemoState';
import { PresenterTimeController } from './services/presenter-time-controller';
import { getAllTimelineEvents, type TimelineEvent } from './services/demo-timeline-service';
import { generateFinalReportSnapshot, hasSnapshot } from './services/final-report-snapshot.service';
import { supabase } from './lib/supabase';
import ControlRoomHeader from './components/ControlRoomHeader';
import TerritorialScopeMap from './components/TerritorialScopeMap';
import EventFeed from './components/EventFeed';
import FinalReport from './components/FinalReport';
import CommercialClosingScreen from './components/CommercialClosingScreen';
import ReportGenerationScreen from './components/ReportGenerationScreen';
import DraggablePresenterPanel from './components/DraggablePresenterPanel';
import EventFeedFilters, { type EventFilters } from './components/EventFeedFilters';
import { applyEventFilters } from './utils/event-filters';
import CriticalEventAlert from './components/CriticalEventAlert';
import RiskAccumulators from './components/RiskAccumulators';
import JourneyContext from './components/JourneyContext';

export default function ControlRoom() {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState<string>('');
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4 | 8>(1);
  const [allTimelineEvents, setAllTimelineEvents] = useState<TimelineEvent[]>([]);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [showCommercialClosing, setShowCommercialClosing] = useState(false);
  const [showReportGeneration, setShowReportGeneration] = useState(false);
  const [reportViewedBefore, setReportViewedBefore] = useState(false);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [eventFilters, setEventFilters] = useState<EventFilters>({
    severity: 'all',
    municipality: 'all',
    eventTypes: new Set(),
    timeSegment: 'all',
  });

  useEffect(() => {
    const fetchCampaignId = async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('id, name')
        .limit(1)
        .maybeSingle();

      if (data) {
        setCampaignId(data.id);
        setCampaignName(data.name || 'Campaña Electoral');
      }
    };

    fetchCampaignId();
  }, []);

  useEffect(() => {
    if (!campaignId) return;

    const loadEvents = async () => {
      const events = await getAllTimelineEvents(campaignId);
      setAllTimelineEvents(events);
    };

    loadEvents();
  }, [campaignId]);

  const { state: simulationState, loading: simulationLoading, error: simulationError } = useDemoSimulationState(campaignId);

  const presenterController = useMemo(
    () => campaignId ? new PresenterTimeController(campaignId) : null,
    [campaignId]
  );

  usePresenterAutoPlay({
    isRunning: simulationState?.isRunning ?? false,
    currentMinute: simulationState?.currentMinute ?? 0,
    controller: presenterController,
    speed: playbackSpeed
  });

  const currentMinute = simulationState?.currentMinute ?? 0;

  const { data: municipalities } = useMunicipalitiesInScope(campaignId);
  const { data: absentWitnesses } = useAbsentWitnesses(campaignId, currentMinute);
  const { data: pollingPlaceAggregates } = usePollingPlaceAggregate(campaignId, currentMinute);
  const { data: finalReportData, loading: finalReportLoading } = useFinalReport(campaignId, showFinalReport);

  const visibleTimelineEvents = useMemo(() => {
    return allTimelineEvents.filter(event => event.scheduled_minute <= currentMinute);
  }, [allTimelineEvents, currentMinute]);

  const uniqueMunicipalities = useMemo(() => {
    const munSet = new Set<string>();
    allTimelineEvents.forEach(event => {
      if (event.polling_table?.polling_place.municipality.name) {
        munSet.add(event.polling_table.polling_place.municipality.name);
      }
    });
    return Array.from(munSet).sort();
  }, [allTimelineEvents]);

  const filteredEvents = useMemo(() => {
    return applyEventFilters(visibleTimelineEvents, eventFilters);
  }, [visibleTimelineEvents, eventFilters]);

  const hasActiveFilters =
    eventFilters.severity !== 'all' ||
    eventFilters.municipality !== 'all' ||
    eventFilters.eventTypes.size > 0 ||
    eventFilters.timeSegment !== 'all';

  const totalTables = municipalities?.reduce((sum, mun) =>
    sum + mun.polling_places.reduce((placeSum, place) => placeSum + place.total_tables, 0), 0
  ) ?? 0;

  const tablesCovered = municipalities?.reduce((sum, mun) =>
    sum + mun.polling_places.reduce((placeSum, place) => placeSum + place.tables_covered, 0), 0
  ) ?? 0;

  const totalPollingPlaces = municipalities?.reduce((sum, mun) =>
    sum + mun.polling_places.length, 0
  ) ?? 0;

  const derivedState = useDerivedDemoState(visibleTimelineEvents, totalTables);

  const criticalEvent = useMemo(() => {
    const recentEvents = visibleTimelineEvents.slice().reverse();
    for (const event of recentEvents) {
      if (
        event.payload.severity === 'CRITICAL' ||
        (event.event_type === 'INCIDENT' && event.payload.severity === 'HIGH')
      ) {
        return event;
      }
    }
    return null;
  }, [visibleTimelineEvents]);

  const criticalRisksCount = useMemo(() => {
    return visibleTimelineEvents.filter(event => {
      if (event.event_type === 'NO_SHOW') return true;
      if (event.event_type === 'INCIDENT') {
        const incidentType = event.payload.incident_type?.toLowerCase() || '';
        return (
          event.payload.severity === 'CRITICAL' ||
          event.payload.severity === 'HIGH' ||
          incidentType.includes('restricción') ||
          incidentType.includes('testigo') ||
          incidentType.includes('conteo') ||
          incidentType.includes('anticipado') ||
          incidentType.includes('e14') ||
          incidentType.includes('alterado') ||
          incidentType.includes('interferencia')
        );
      }
      return false;
    }).length;
  }, [visibleTimelineEvents]);

  const tablesUnderObservationCount = useMemo(() => {
    const observedTables = new Set<string>();
    visibleTimelineEvents.forEach(event => {
      if (
        event.event_type === 'INCIDENT' ||
        event.event_type === 'NO_SHOW' ||
        event.event_type === 'EVIDENCE'
      ) {
        if (event.polling_table_id) {
          observedTables.add(event.polling_table_id);
        }
      }
    });
    return observedTables.size;
  }, [visibleTimelineEvents]);

  const sensitiveEvidenceCount = useMemo(() => {
    return visibleTimelineEvents.filter(event => {
      return (
        event.event_type === 'EVIDENCE' &&
        event.payload.severity !== 'LOW' &&
        event.payload.severity !== 'INFO'
      );
    }).length;
  }, [visibleTimelineEvents]);

  const operationalSignalsCount = useMemo(() => {
    return visibleTimelineEvents.filter(event => {
      return event.event_type === 'SIGNAL';
    }).length;
  }, [visibleTimelineEvents]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' ||
                          target.tagName === 'TEXTAREA' ||
                          target.isContentEditable;

      if (isInputField) return;

      const isT = e.key.toLowerCase() === 't';
      if (!isT) return;

      const macShortcut = (e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey;
      const windowsShortcut = e.ctrlKey && e.altKey && e.shiftKey && !e.metaKey;

      if (macShortcut || windowsShortcut) {
        e.preventDefault();
        setIsPresenterMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (!campaignId || currentMinute < 572) return;

    let isMounted = true;

    async function generateSnapshot() {
      try {
        const snapshotExists = await hasSnapshot(campaignId);
        if (!snapshotExists && isMounted) {
          await generateFinalReportSnapshot(campaignId);
        }
      } catch (error) {
        console.error('Error generating final report snapshot:', error);
      }
    }

    generateSnapshot();

    return () => {
      isMounted = false;
    };
  }, [campaignId, currentMinute]);

  if (!campaignId || simulationLoading) {
    return (
      <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <div className="text-gray-400 text-lg">Cargando Control Room...</div>
        </div>
      </div>
    );
  }

  if (simulationError || !simulationState) {
    return (
      <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <div className="text-gray-300 text-lg mb-2">Error al cargar datos</div>
          <div className="text-gray-500 text-sm">{simulationError || 'No se encontró campaña activa'}</div>
        </div>
      </div>
    );
  }

  if (showCommercialClosing) {
    return (
      <CommercialClosingScreen
        onContactClick={() => {
          console.log('Contact team clicked');
          window.open('mailto:contact@warroom.com', '_blank');
        }}
        onImplementClick={() => {
          console.log('Implement War Room clicked');
          window.open('mailto:sales@warroom.com', '_blank');
        }}
      />
    );
  }

  if (showReportGeneration) {
    return (
      <ReportGenerationScreen
        onComplete={() => {
          setShowReportGeneration(false);
          setShowFinalReport(true);
          setReportViewedBefore(true);
        }}
      />
    );
  }

  if (showFinalReport) {
    if (finalReportLoading || !finalReportData) {
      return (
        <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
            <div className="text-gray-400 text-lg">Generando Informe Final...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen overflow-y-auto bg-[#0f1115] text-gray-100">
        <FinalReport
          data={finalReportData}
          campaignName={campaignName}
          onClose={() => setShowFinalReport(false)}
          onFinishDemo={() => setShowCommercialClosing(true)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen bg-[#1a1d23] text-gray-100 relative flex flex-col lg:overflow-hidden">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col min-h-screen lg:h-full lg:overflow-hidden">
        <ControlRoomHeader
          campaignName={campaignName}
          municipalityCount={municipalities?.length ?? 0}
          currentMinute={currentMinute}
          pollingPlacesCount={totalPollingPlaces}
          tablesCount={totalTables}
        />

        {showMapView ? (
          <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
            <div className={`${showMapMobile ? 'fixed inset-0 z-40' : 'hidden'} lg:block lg:relative lg:flex-1 bg-[#12151a]/40 overflow-hidden`}>
              {showMapMobile && (
                <button
                  onClick={() => setShowMapMobile(false)}
                  className="absolute top-4 right-4 z-50 px-4 py-2 bg-gray-900/90 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700 text-sm font-medium war-room-interactive"
                >
                  Cerrar Mapa
                </button>
              )}
              <TerritorialScopeMap municipalities={municipalities || []} />
            </div>

            <div className="lg:hidden p-4">
              <button
                onClick={() => setShowMapMobile(true)}
                className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 font-medium text-sm rounded-lg war-room-interactive flex items-center justify-center space-x-2 border border-gray-700/50"
              >
                <Map className="w-5 h-5" />
                <span>Ver Mapa</span>
              </button>
            </div>

            <div className="p-4 flex justify-center">
              <button
                onClick={() => setShowMapView(false)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg border border-gray-700 war-room-interactive"
              >
                Volver a Vista Operativa
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
            <div className="lg:w-[40%] flex flex-col lg:border-r border-gray-800/50 bg-[#12151a]/40 p-4 lg:p-6 space-y-4 lg:overflow-y-auto">
              {criticalEvent && (
                <CriticalEventAlert criticalEvent={criticalEvent} />
              )}

              <RiskAccumulators
                criticalRisks={criticalRisksCount}
                tablesUnderObservation={tablesUnderObservationCount}
                sensitiveEvidence={sensitiveEvidenceCount}
                operationalSignals={operationalSignalsCount}
              />

              <JourneyContext
                witnessesOperatingPercent={derivedState.testigos_presentes_percent}
                tablesClosedPercent={derivedState.mesas_cerradas_percent}
                e14ReceivedPercent={derivedState.e14_recibidos_percent}
                showTablesClosed={currentMinute >= 540}
                showE14={currentMinute >= 572}
              />

              <div className="lg:hidden">
                <button
                  onClick={() => setShowMapView(true)}
                  className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 font-medium text-sm rounded-lg war-room-interactive flex items-center justify-center space-x-2 border border-gray-700/50"
                >
                  <Map className="w-5 h-5" />
                  <span>Ver Mapa</span>
                </button>
              </div>

              <div className="hidden lg:block">
                <button
                  onClick={() => setShowMapView(true)}
                  className="w-full px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 font-medium text-sm rounded-lg war-room-interactive flex items-center justify-center space-x-2 border border-gray-700/50"
                >
                  <Map className="w-5 h-5" />
                  <span>Ver Mapa</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:overflow-hidden">
              {currentMinute >= 572 && (
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800/50 bg-[#0f1115]/40">
                  <button
                    onClick={() => {
                      if (reportViewedBefore) {
                        setShowFinalReport(true);
                      } else {
                        setShowReportGeneration(true);
                      }
                    }}
                    className="w-full px-4 sm:px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-[13px] uppercase tracking-wider rounded-lg war-room-interactive flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <FileCheck className="w-5 h-5" />
                    <span>Ver Informe Final</span>
                  </button>
                </div>
              )}

              <div className="p-4 lg:p-6 lg:flex-1 lg:overflow-hidden">
                <div className="lg:h-full bg-[#12151a]/80 backdrop-blur-sm rounded-lg border border-gray-800/50 p-3 sm:p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <div className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider">Feed de Eventos</div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">{filteredEvents.length}</div>
                  </div>

                  <EventFeedFilters
                    filters={eventFilters}
                    onFiltersChange={setEventFilters}
                    municipalities={uniqueMunicipalities}
                  />

                  <div className="min-h-[400px] lg:min-h-0 lg:flex-1 lg:overflow-hidden">
                    <EventFeed events={filteredEvents} isFiltered={hasActiveFilters} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isPresenterMode && presenterController && (
        <DraggablePresenterPanel
          currentMinute={simulationState.currentMinute}
          isRunning={simulationState.isRunning}
          speed={playbackSpeed}
          onMinuteChange={(minute) => presenterController.setMinute(minute)}
          onPlay={() => presenterController.play()}
          onPause={() => presenterController.pause()}
          onReset={() => presenterController.reset()}
          onSpeedChange={setPlaybackSpeed}
          onClose={() => setIsPresenterMode(false)}
        />
      )}
    </div>
  );
}
