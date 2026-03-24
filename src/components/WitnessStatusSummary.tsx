import { Users, UserCheck, UserX } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface WitnessStatusSummaryProps {
  totalWitnesses: number;
  presentCount: number;
  absentCount: number;
}

export default function WitnessStatusSummary({
  totalWitnesses,
  presentCount,
  absentCount
}: WitnessStatusSummaryProps) {
  return (
    <div className="bg-[#12151a]/80 backdrop-blur-sm rounded-lg border border-gray-800/50 p-4 war-room-card-hover">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="w-4 h-4 text-gray-400" />
        <div className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Estado de Testigos
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-800/50 war-room-card-hover">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-gray-400">Presentes</span>
          </div>
          <AnimatedCounter value={presentCount} className="text-xl font-bold text-emerald-400" />
        </div>
        <div className={`flex items-center justify-between p-3 rounded border war-room-card-hover ${
          absentCount > 0
            ? 'bg-red-500/5 border-red-500/30 animate-pulse-glow text-red-500'
            : 'bg-gray-900/50 border-gray-800/50'
        }`}>
          <div className="flex items-center space-x-2">
            <UserX className={`w-4 h-4 ${absentCount > 0 ? 'text-red-400 animate-pulse' : 'text-gray-600'}`} />
            <span className="text-sm text-gray-400">Ausentes</span>
          </div>
          <AnimatedCounter value={absentCount} className={`text-xl font-bold ${absentCount > 0 ? 'text-red-400' : 'text-gray-600'}`} />
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-800/50 war-room-card-hover">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Total</span>
          </div>
          <AnimatedCounter value={totalWitnesses} className="text-xl font-bold text-gray-300" />
        </div>
      </div>
    </div>
  );
}
