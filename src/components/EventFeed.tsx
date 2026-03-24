import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, Image as ImageIcon, FileText, Activity, Filter } from 'lucide-react';
import type { TimelineEvent } from '../services/demo-timeline-service';
import { formatMinuteAsTime } from '../utils/simulated-time';

interface EventFeedProps {
  events: TimelineEvent[];
  isFiltered?: boolean;
}

interface EventAttentionState {
  eventId: string;
  activeUntil: number;
}

const ATTENTION_DURATION_MS = 25000;

function isHighlightedEvent(event: TimelineEvent): boolean {
  const isCriticalSeverity = event.payload.severity === 'CRITICAL';
  const isIncident = event.event_type === 'INCIDENT';
  const isEvidence = event.event_type === 'EVIDENCE';

  return isCriticalSeverity || isIncident || isEvidence;
}

export default function EventFeed({ events, isFiltered = false }: EventFeedProps) {
  const [attentionStates, setAttentionStates] = useState<Map<string, EventAttentionState>>(new Map());
  const [newEvents, setNewEvents] = useState<Set<string>>(new Set());
  const previousEventIdsRef = useRef<Set<string>>(new Set());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const currentEventIds = new Set(events.map(e => e.id));
    const previousEventIds = previousEventIdsRef.current;

    const trulyNewEvents = events.filter(event => {
      return !previousEventIds.has(event.id) && isHighlightedEvent(event);
    });

    if (trulyNewEvents.length > 0) {
      const now = Date.now();
      const newAttentionStates = new Map(attentionStates);
      const newEventIds = new Set(newEvents);

      trulyNewEvents.forEach(event => {
        newEventIds.add(event.id);
        newAttentionStates.set(event.id, {
          eventId: event.id,
          activeUntil: now + ATTENTION_DURATION_MS
        });

        const existingTimeout = timeoutRefs.current.get(event.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const timeout = setTimeout(() => {
          setAttentionStates(prev => {
            const updated = new Map(prev);
            updated.delete(event.id);
            return updated;
          });
          setNewEvents(prev => {
            const updated = new Set(prev);
            updated.delete(event.id);
            return updated;
          });
          timeoutRefs.current.delete(event.id);
        }, ATTENTION_DURATION_MS);

        timeoutRefs.current.set(event.id, timeout);
      });

      setNewEvents(newEventIds);
      setAttentionStates(newAttentionStates);
    }

    previousEventIdsRef.current = currentEventIds;

    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, [events]);

  const getEventIcon = (eventType: TimelineEvent['event_type']) => {
    switch (eventType) {
      case 'CHECK_IN':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'NO_SHOW':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'INCIDENT':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'EVIDENCE':
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'TABLE_CLOSE':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'E14_RECEIVED':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'SIGNAL':
        return <Activity className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventLabel = (event: TimelineEvent): string => {
    if (event.payload.ui_label) {
      return event.payload.ui_label;
    }

    switch (event.event_type) {
      case 'CHECK_IN':
        return 'Check-in realizado';
      case 'NO_SHOW':
        return 'Testigo no llegó';
      case 'INCIDENT':
        return event.payload.message || event.payload.incident_type || 'Incidencia reportada';
      case 'EVIDENCE':
        return event.payload.evidence_type || 'Evidencia recibida';
      case 'TABLE_CLOSE':
        return 'Mesa cerrada';
      case 'E14_RECEIVED':
        return 'Formulario E14 recibido';
      case 'SIGNAL':
        return event.payload.message || 'Señal detectada';
      default:
        return 'Evento registrado';
    }
  };

  const shouldShowFullContext = (eventType: TimelineEvent['event_type']): boolean => {
    return eventType === 'INCIDENT' || eventType === 'EVIDENCE';
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTime = (minute: number) => {
    return formatMinuteAsTime(minute);
  };

  if (events.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-8">
          {isFiltered ? (
            <>
              <Filter className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <div className="text-gray-500 text-sm font-medium">No hay eventos para este filtro</div>
              <div className="text-gray-600 text-[12px] mt-1">Intenta ajustar los criterios de búsqueda</div>
            </>
          ) : (
            <>
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <div className="text-gray-500 text-sm font-medium">Inicio de jornada</div>
              <div className="text-gray-600 text-[12px] mt-1">Los eventos aparecerán conforme avance el día</div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:h-full flex flex-col lg:overflow-hidden">
      <div className="flex-1 space-y-2 lg:overflow-y-auto">
        {events.slice().reverse().map((event, index) => {
          const isHighlighted = isHighlightedEvent(event);
          const hasActiveAttention = attentionStates.has(event.id);
          const isNew = newEvents.has(event.id);

          let borderClass = 'border-gray-800/50';
          let bgClass = 'bg-gray-900/50';
          let animationClass = '';

          if (isHighlighted) {
            if (hasActiveAttention) {
              if (event.event_type === 'INCIDENT' || event.payload.severity === 'CRITICAL') {
                borderClass = 'border-red-500/50';
                bgClass = 'bg-red-950/20';
              } else if (event.event_type === 'EVIDENCE') {
                borderClass = 'border-purple-500/50';
                bgClass = 'bg-purple-950/20';
              }
            } else {
              if (event.event_type === 'INCIDENT' || event.payload.severity === 'CRITICAL') {
                borderClass = 'border-red-900/30';
              } else if (event.event_type === 'EVIDENCE') {
                borderClass = 'border-purple-900/30';
              }
            }

            if (isNew) {
              animationClass = 'animate-highlightedEntry';
            }
          } else {
            if (isNew) {
              animationClass = 'animate-normalEntry';
            }
          }

          return (
            <div
              key={event.id}
              className={`p-2 sm:p-3 rounded border transition-all duration-700 ${bgClass} ${borderClass} ${animationClass}`}
            >
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="mt-0.5 flex-shrink-0">{getEventIcon(event.event_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1">
                    <div className={`text-[11px] sm:text-[13px] line-clamp-2 transition-all duration-700 ${
                      isHighlighted && hasActiveAttention
                        ? event.event_type === 'INCIDENT' || event.payload.severity === 'CRITICAL'
                          ? 'text-red-300 font-semibold'
                          : 'text-purple-300 font-semibold'
                        : isHighlighted
                        ? event.event_type === 'INCIDENT' || event.payload.severity === 'CRITICAL'
                          ? 'text-red-400/70 font-medium'
                          : 'text-purple-400/70 font-medium'
                        : 'text-gray-200 font-normal'
                    }`}>
                      {getEventLabel(event)}
                    </div>
                    <div className="text-[10px] sm:text-[12px] font-mono text-gray-500 whitespace-nowrap flex-shrink-0">
                      {formatTime(event.scheduled_minute)}
                    </div>
                  </div>

                  {shouldShowFullContext(event.event_type) && event.polling_table ? (
                    <div className="space-y-1 mt-1.5">
                      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px]">
                        <span className="text-gray-600 font-medium">Municipio:</span>
                        <span className="text-gray-300">{event.polling_table.polling_place.municipality.name}</span>

                        <span className="text-gray-600 font-medium">Puesto:</span>
                        <span className="text-gray-300">{event.polling_table.polling_place.name}</span>

                        <span className="text-gray-600 font-medium">Mesa:</span>
                        <span className="text-gray-300">{String(event.polling_table.table_number).padStart(3, '0')}</span>

                        {event.witness && (
                          <>
                            <span className="text-gray-600 font-medium">Testigo:</span>
                            <span className="text-gray-300">{event.witness.full_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : event.polling_table ? (
                    <div className="text-[10px] sm:text-[12px] text-gray-500 truncate">
                      {event.polling_table.polling_place.name} • Mesa {String(event.polling_table.table_number).padStart(3, '0')} • {event.polling_table.polling_place.municipality.name}
                    </div>
                  ) : null}

                  {event.payload.severity && (
                    <div className={`mt-1.5 sm:mt-2 inline-block px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium uppercase tracking-wider border ${getSeverityColor(event.payload.severity)}`}>
                      {event.payload.severity}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
