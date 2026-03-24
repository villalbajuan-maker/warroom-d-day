import { useMemo } from 'react';
import type { TimelineEvent } from '../services/demo-timeline-service';

export interface DerivedDemoState {
  testigos_presentes_count: number;
  testigos_presentes_percent: number | null;
  testigos_ausentes_count: number;
  incidencias_count: number;
  evidencias_count: number;
  mesas_cerradas_count: number;
  mesas_cerradas_percent: number | null;
  e14_recibidos_count: number;
  e14_recibidos_percent: number | null;
  check_in_count: number;
  critical_incidents_count: number;
}

function parsePercentageFromLabel(label: string): number | null {
  const percentMatch = label.match(/(\d+)%/);
  return percentMatch ? parseInt(percentMatch[1], 10) : null;
}

export function useDerivedDemoState(
  visibleEvents: TimelineEvent[],
  totalTables: number
): DerivedDemoState {
  return useMemo(() => {
    let testigos_presentes_percent: number | null = null;
    let testigos_ausentes_count = 0;
    let incidencias_count = 0;
    let evidencias_count = 0;
    let mesas_cerradas_count = 0;
    let mesas_cerradas_percent: number | null = null;
    let e14_recibidos_count = 0;
    let e14_recibidos_percent: number | null = null;
    let check_in_count = 0;
    let critical_incidents_count = 0;

    const checkedInTables = new Set<string>();
    const closedTables = new Set<string>();
    const e14Tables = new Set<string>();

    visibleEvents.forEach(event => {
      switch (event.event_type) {
        case 'SIGNAL': {
          const label = event.payload.ui_label || '';
          const percent = parsePercentageFromLabel(label);

          if (label.toLowerCase().includes('testigos') &&
              (label.toLowerCase().includes('check-in') ||
               label.toLowerCase().includes('operando') ||
               label.toLowerCase().includes('presentes'))) {
            if (percent !== null) {
              testigos_presentes_percent = percent;
            }
          } else if (label.toLowerCase().includes('mesas cerradas')) {
            if (percent !== null) {
              mesas_cerradas_percent = percent;
            }
          } else if (label.toLowerCase().includes('e14') || label.toLowerCase().includes('formularios')) {
            if (percent !== null) {
              e14_recibidos_percent = percent;
            }
          }
          break;
        }

        case 'CHECK_IN': {
          check_in_count++;
          if (event.polling_table_id) {
            checkedInTables.add(event.polling_table_id);
          }
          break;
        }

        case 'NO_SHOW': {
          testigos_ausentes_count++;
          break;
        }

        case 'INCIDENT': {
          incidencias_count++;
          if (event.payload.severity === 'CRITICAL' || event.payload.severity === 'HIGH') {
            critical_incidents_count++;
          }
          break;
        }

        case 'EVIDENCE': {
          evidencias_count++;
          break;
        }

        case 'TABLE_CLOSE': {
          if (event.polling_table_id) {
            closedTables.add(event.polling_table_id);
          }
          mesas_cerradas_count++;
          break;
        }

        case 'E14_RECEIVED': {
          if (event.polling_table_id) {
            e14Tables.add(event.polling_table_id);
          }
          e14_recibidos_count++;
          break;
        }
      }
    });

    let testigos_presentes_count: number;
    if (testigos_presentes_percent !== null) {
      testigos_presentes_count = Math.round((testigos_presentes_percent / 100) * totalTables);
    } else {
      testigos_presentes_count = check_in_count - testigos_ausentes_count;
    }

    if (mesas_cerradas_percent !== null && totalTables > 0) {
      mesas_cerradas_count = Math.round((mesas_cerradas_percent / 100) * totalTables);
    } else {
      mesas_cerradas_count = closedTables.size;
    }

    if (e14_recibidos_percent !== null && totalTables > 0) {
      e14_recibidos_count = Math.round((e14_recibidos_percent / 100) * totalTables);
    } else {
      e14_recibidos_count = e14Tables.size;
    }

    return {
      testigos_presentes_count,
      testigos_presentes_percent,
      testigos_ausentes_count,
      incidencias_count,
      evidencias_count,
      mesas_cerradas_count,
      mesas_cerradas_percent,
      e14_recibidos_count,
      e14_recibidos_percent,
      check_in_count,
      critical_incidents_count,
    };
  }, [visibleEvents, totalTables]);
}
