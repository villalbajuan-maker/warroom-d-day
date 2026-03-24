import { AlertTriangle } from 'lucide-react';
import type { AbsentWitness } from '../types/control-room-services';

interface CriticalAlertsProps {
  absentWitnesses: AbsentWitness[];
}

export default function CriticalAlerts({ absentWitnesses }: CriticalAlertsProps) {
  if (absentWitnesses.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-950/30 backdrop-blur-sm rounded-lg border border-red-500/30 p-4 animate-pulse-glow text-red-500">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>Alertas Críticas</span>
        </div>
        <div className="text-xs font-semibold px-2 py-1 bg-red-500/20 text-red-400 rounded animate-count-change">
          {absentWitnesses.length}
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {absentWitnesses.map((witness, index) => (
          <div
            key={witness.witness_id}
            className="p-3 bg-gray-900/50 rounded border border-red-500/20 war-room-card-hover animate-fadeInUp"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="text-sm font-semibold text-red-300">{witness.witness_name}</div>
              <div className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-red-500/30 text-red-300 border border-red-500/50">
                AUSENTE
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Mesa {witness.table_number} • {witness.polling_place_name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
