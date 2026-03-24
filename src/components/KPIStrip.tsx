import type { PollingPlaceAggregateState } from '../types/control-room-services';
import AnimatedCounter from './AnimatedCounter';

interface KPIStripProps {
  pollingPlaces: PollingPlaceAggregateState[];
  totalTables: number;
  tablesCovered: number;
  witnessesPresent: number;
}

export default function KPIStrip({ pollingPlaces, totalTables, tablesCovered, witnessesPresent }: KPIStripProps) {
  const totalIncidents = pollingPlaces.reduce((sum, p) => sum + p.incidents_count, 0);
  const totalEvidences = pollingPlaces.reduce((sum, p) => sum + p.evidences_count, 0);

  return (
    <div className="grid grid-cols-5 gap-4 px-6 py-5 bg-[#0f1115]/95 border-b border-gray-800/50">
      <div className="bg-[#12151a]/80 backdrop-blur-sm rounded-lg border border-gray-800/50 p-4 war-room-card-hover">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Mesas Totales</div>
        <AnimatedCounter value={totalTables} className="text-3xl font-bold text-gray-300" />
      </div>

      <div className="bg-[#12151a]/80 backdrop-blur-sm rounded-lg border border-gray-800/50 p-4 war-room-card-hover">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Mesas Cubiertas</div>
        <AnimatedCounter value={tablesCovered} className="text-3xl font-bold text-emerald-400" />
      </div>

      <div className="bg-[#12151a]/80 backdrop-blur-sm rounded-lg border border-emerald-500/50 bg-emerald-500/5 p-4 war-room-card-hover">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Testigos Presentes</div>
        <AnimatedCounter value={witnessesPresent} className="text-3xl font-bold text-emerald-400" />
      </div>

      <div className={`bg-[#12151a]/80 backdrop-blur-sm rounded-lg border p-4 war-room-card-hover ${
        totalIncidents > 0 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-gray-800/50'
      }`}>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Incidencias Activas</div>
        <AnimatedCounter
          value={totalIncidents}
          className={`text-3xl font-bold ${totalIncidents > 0 ? 'text-yellow-400' : 'text-gray-400'}`}
        />
      </div>

      <div className="bg-[#12151a]/80 backdrop-blur-sm rounded-lg border border-gray-800/50 p-4 war-room-card-hover">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Evidencias Recibidas</div>
        <AnimatedCounter value={totalEvidences} className="text-3xl font-bold text-blue-400" />
      </div>
    </div>
  );
}
