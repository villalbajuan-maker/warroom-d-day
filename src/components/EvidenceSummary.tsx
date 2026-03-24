import { Image as ImageIcon, FileText } from 'lucide-react';
import type { TimelineEvent } from '../services/demo-timeline-service';
import { formatMinuteAsTime } from '../utils/simulated-time';

interface EvidenceSummaryProps {
  events: TimelineEvent[];
}

export default function EvidenceSummary({ events }: EvidenceSummaryProps) {
  const evidenceEvents = events
    .filter(e => e.event_type === 'EVIDENCE')
    .slice(-10)
    .reverse();

  return (
    <div className="bg-[#12151a]/80 backdrop-blur-sm rounded-lg border border-gray-800/50 p-4 war-room-card-hover">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Evidencias Recientes
        </div>
        <div className="text-xs text-gray-500">{evidenceEvents.length}</div>
      </div>
      <div className="space-y-2">
        {evidenceEvents.length === 0 ? (
          <div className="text-center py-4 text-gray-600 text-xs">
            Sin evidencias aún
          </div>
        ) : (
          evidenceEvents.map((event, index) => (
            <div
              key={event.id}
              className="p-2 bg-gray-900/50 rounded border border-gray-800/50 hover:border-blue-500/30 war-room-interactive animate-fadeInUp"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center space-x-2 mb-1">
                {event.payload.evidence_type === 'document' ? (
                  <FileText className="w-3 h-3 text-blue-400" />
                ) : (
                  <ImageIcon className="w-3 h-3 text-blue-400" />
                )}
                <div className="text-xs font-medium text-gray-300 flex-1 truncate">
                  {event.polling_table ? `Mesa ${event.polling_table.table_number}` : 'Evidencia'}
                </div>
                <div className="text-[10px] font-mono text-gray-500">
                  {formatMinuteAsTime(event.scheduled_minute)}
                </div>
              </div>
              {event.polling_table && (
                <div className="text-[10px] text-gray-500 truncate">
                  {event.polling_table.polling_place.name}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
