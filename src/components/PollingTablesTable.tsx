import { CheckCircle2, X } from 'lucide-react';
import type { PollingTableState } from '../types/control-room-services';

interface PollingTablesTableProps {
  tables: PollingTableState[];
}

export default function PollingTablesTable({ tables }: PollingTablesTableProps) {
  const sortedTables = [...tables].sort((a, b) => {
    const getStatusPriority = (table: PollingTableState) => {
      if (!table.checked_in) return 0;
      if (table.incidents_count > 0) return 1;
      if (table.evidences_count > 0) return 2;
      return 3;
    };

    const priorityDiff = getStatusPriority(a) - getStatusPriority(b);
    if (priorityDiff !== 0) return priorityDiff;

    const munCompare = a.municipality_name.localeCompare(b.municipality_name);
    if (munCompare !== 0) return munCompare;

    const placeCompare = a.polling_place_name.localeCompare(b.polling_place_name);
    if (placeCompare !== 0) return placeCompare;

    return a.table_number - b.table_number;
  });

  const getStatusBadge = (table: PollingTableState) => {
    if (!table.checked_in) {
      return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">SIN REPORTE</span>;
    }
    if (table.closed && table.e14_received) {
      return <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">COMPLETO</span>;
    }
    if (table.closed) {
      return <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">CERRADO</span>;
    }
    if (table.incidents_count > 0) {
      return <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">ALERTA</span>;
    }
    return <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">OPERANDO</span>;
  };

  return (
    <div className="h-full bg-[#12151a]/80 backdrop-blur-sm rounded-lg border border-gray-800/50 overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-gray-800/50 flex-shrink-0">
        <div className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Mesas de Votación
        </div>
        <div className="text-xs text-gray-500 mt-1">{tables.length} mesas en total</div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50 sticky top-0 z-10">
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3 text-left font-semibold">Mesa</th>
              <th className="px-6 py-3 text-left font-semibold">Puesto</th>
              <th className="px-6 py-3 text-left font-semibold">Municipio</th>
              <th className="px-6 py-3 text-left font-semibold">Testigo</th>
              <th className="px-6 py-3 text-center font-semibold">Check-in</th>
              <th className="px-6 py-3 text-center font-semibold">Incidencias</th>
              <th className="px-6 py-3 text-center font-semibold">Evidencias</th>
              <th className="px-6 py-3 text-left font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {sortedTables.map((table) => {
              const hasCriticalStatus = !table.checked_in || table.incidents_count > 0;

              return (
                <tr
                  key={table.polling_table_id}
                  className={`text-sm text-gray-300 war-room-transition hover:bg-gray-800/50 ${
                    hasCriticalStatus ? 'hover:border-l-2 hover:border-l-yellow-500/50' : ''
                  }`}
                >
                  <td className="px-6 py-3 font-mono font-semibold">{table.table_number}</td>
                  <td className="px-6 py-3 text-gray-400">{table.polling_place_name}</td>
                  <td className="px-6 py-3 text-gray-400">{table.municipality_name}</td>
                  <td className="px-6 py-3 text-gray-300">{table.witness_name || '—'}</td>
                  <td className="px-6 py-3 text-center">
                    {table.checked_in ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto war-room-transition" />
                    ) : (
                      <X className="w-5 h-5 text-red-500/70 mx-auto war-room-transition" />
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {table.incidents_count > 0 ? (
                      <span className="font-bold text-yellow-400 animate-pulse">{table.incidents_count}</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {table.evidences_count > 0 ? (
                      <span className="font-semibold text-blue-400">{table.evidences_count}</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {getStatusBadge(table)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
