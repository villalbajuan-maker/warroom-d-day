import type { TimelineEvent } from '../services/demo-timeline-service';
import type { EventFilters } from '../components/EventFeedFilters';

export function applyEventFilters(events: TimelineEvent[], filters: EventFilters): TimelineEvent[] {
  return events.filter(event => {
    if (!passesSeverityFilter(event, filters.severity)) return false;
    if (!passesMunicipalityFilter(event, filters.municipality)) return false;
    if (!passesEventTypeFilter(event, filters.eventTypes)) return false;
    if (!passesTimeSegmentFilter(event, filters.timeSegment)) return false;
    return true;
  });
}

function passesSeverityFilter(event: TimelineEvent, severity: string): boolean {
  if (severity === 'all') return true;

  switch (severity) {
    case 'critical':
      return event.payload.severity === 'CRITICAL' || event.event_type === 'SIGNAL';
    case 'incidents':
      return event.event_type === 'INCIDENT';
    case 'evidence':
      return event.event_type === 'EVIDENCE' || event.event_type === 'E14_RECEIVED';
    case 'operational':
      return event.event_type === 'CHECK_IN' || event.event_type === 'TABLE_CLOSE';
    default:
      return true;
  }
}

function passesMunicipalityFilter(event: TimelineEvent, municipality: string): boolean {
  if (municipality === 'all') return true;
  return event.polling_table?.polling_place.municipality.name === municipality;
}

function passesEventTypeFilter(event: TimelineEvent, eventTypes: Set<string>): boolean {
  if (eventTypes.size === 0) return true;
  return eventTypes.has(event.event_type);
}

function passesTimeSegmentFilter(event: TimelineEvent, timeSegment: string): boolean {
  if (timeSegment === 'all') return true;

  const minute = event.scheduled_minute;

  switch (timeSegment) {
    case 'apertura':
      return minute >= 0 && minute < 60;
    case 'manana':
      return minute >= 60 && minute < 240;
    case 'mediodia':
      return minute >= 240 && minute < 360;
    case 'tarde':
      return minute >= 360 && minute < 480;
    case 'cierre':
      return minute >= 480;
    default:
      return true;
  }
}
