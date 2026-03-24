import { AlertTriangle } from 'lucide-react';
import type { TimelineEvent } from '../services/demo-timeline-service';

interface CriticalEventAlertProps {
  criticalEvent: TimelineEvent | null;
}

function getRiskLabel(event: TimelineEvent): string {
  if (event.payload.incident_type) {
    return event.payload.incident_type;
  }
  if (event.payload.ui_label) {
    return event.payload.ui_label;
  }
  if (event.event_type === 'INCIDENT') {
    return 'Incidencia Crítica Detectada';
  }
  if (event.event_type === 'EVIDENCE') {
    return 'Evidencia Registrada';
  }
  return 'Evento Crítico';
}

function getLocationInfo(event: TimelineEvent) {
  const municipio = event.polling_table?.polling_place.municipality.name || 'No especificado';
  const puesto = event.polling_table?.polling_place.name || 'No especificado';
  const mesa = event.polling_table?.table_number?.toString() || 'No especificada';

  return { municipio, puesto, mesa };
}

export default function CriticalEventAlert({ criticalEvent }: CriticalEventAlertProps) {
  if (!criticalEvent) {
    return null;
  }

  const riskLabel = getRiskLabel(criticalEvent);
  const { municipio, puesto, mesa } = getLocationInfo(criticalEvent);

  return (
    <div className="animate-criticalAlert bg-red-950/30 border-2 border-red-500/60 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-red-300 mb-2">
            {riskLabel}
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-400">
              <span className="text-gray-500">Municipio:</span>{' '}
              <span className="text-gray-300">{municipio}</span>
            </div>
            <div className="text-xs text-gray-400">
              <span className="text-gray-500">Puesto:</span>{' '}
              <span className="text-gray-300">{puesto}</span>
            </div>
            <div className="text-xs text-gray-400">
              <span className="text-gray-500">Mesa:</span>{' '}
              <span className="text-gray-300">{mesa}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
