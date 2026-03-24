import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type { MunicipalityInScope } from '../types/control-room-services';
import type { PollingPlaceAggregateState } from '../types/control-room-services';

interface ListViewProps {
  municipalities: MunicipalityInScope[];
  pollingPlaceAggregates: PollingPlaceAggregateState[];
}

export default function ListView({ municipalities, pollingPlaceAggregates }: ListViewProps) {
  const [expandedMunicipalities, setExpandedMunicipalities] = useState<Set<string>>(new Set());

  const toggleMunicipality = (munCode: string) => {
    setExpandedMunicipalities(prev => {
      const next = new Set(prev);
      if (next.has(munCode)) {
        next.delete(munCode);
      } else {
        next.add(munCode);
      }
      return next;
    });
  };

  const getAggregateForPlace = (placeId: string) => {
    return pollingPlaceAggregates.find(agg => agg.polling_place_id === placeId);
  };

  const getStatusBadge = (status: 'ok' | 'warning' | 'critical') => {
    switch (status) {
      case 'ok':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">OK</span>;
      case 'warning':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">ALERTA</span>;
      case 'critical':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">CRÍTICO</span>;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {municipalities.map(mun => {
            const munKey = `${mun.department_code}-${mun.municipality_code}`;
            const isExpanded = expandedMunicipalities.has(munKey);

            const munStats = mun.polling_places.reduce(
              (acc, place) => {
                return {
                  totalTables: acc.totalTables + place.total_tables,
                  coveredTables: acc.coveredTables + place.tables_covered
                };
              },
              { totalTables: 0, coveredTables: 0 }
            );

            return (
              <div key={munKey} className="bg-[#12151a]/80 backdrop-blur-sm rounded-lg border border-gray-800/50 war-room-card-hover">
                <button
                  onClick={() => toggleMunicipality(munKey)}
                  className="w-full px-4 py-3 flex items-center justify-between war-room-interactive rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 war-room-transition" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 war-room-transition" />
                    )}
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-200">{mun.municipality_name}</div>
                      <div className="text-xs text-gray-500">
                        {mun.polling_places.length} puestos • {munStats.coveredTables}/{munStats.totalTables} mesas cubiertas
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2 animate-fade-in">
                    {mun.polling_places.map((place, index) => {
                      const aggregate = getAggregateForPlace(place.polling_place_id);
                      const hasCriticalIssues = aggregate && (aggregate.incidents_count > 0 || aggregate.signals_count > 0);

                      return (
                        <div
                          key={place.polling_place_id}
                          className={`pl-7 pr-3 py-2 bg-gray-900/50 rounded border border-gray-800/50 war-room-card-hover animate-fadeInUp ${
                            hasCriticalIssues ? 'border-yellow-500/30' : ''
                          }`}
                          style={{ animationDelay: `${index * 40}ms` }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-300">{place.polling_place_name}</div>
                            </div>
                            {aggregate && getStatusBadge(aggregate.status)}
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <div className="text-gray-500">Mesas</div>
                              <div className="text-gray-300 font-semibold">{place.total_tables}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Reportando</div>
                              <div className="text-emerald-400 font-semibold">
                                {aggregate?.checked_in_tables || 0}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Cerradas</div>
                              <div className="text-blue-400 font-semibold">
                                {aggregate?.closed_tables || 0}
                              </div>
                            </div>
                          </div>
                          {aggregate && (aggregate.incidents_count > 0 || aggregate.signals_count > 0) && (
                            <div className="mt-2 flex items-center space-x-3 text-xs">
                              {aggregate.incidents_count > 0 && (
                                <div className="flex items-center space-x-1 text-yellow-400 font-semibold">
                                  <AlertTriangle className="w-3 h-3 animate-pulse" />
                                  <span>{aggregate.incidents_count} incidencias</span>
                                </div>
                              )}
                              {aggregate.signals_count > 0 && (
                                <div className="flex items-center space-x-1 text-orange-400 font-semibold">
                                  <AlertTriangle className="w-3 h-3 animate-pulse" />
                                  <span>{aggregate.signals_count} señales</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
