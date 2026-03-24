import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

export type SeverityFilter = 'all' | 'critical' | 'incidents' | 'evidence' | 'operational';

export interface EventFilters {
  severity: SeverityFilter;
  municipality: string;
  eventTypes: Set<string>;
  timeSegment: string;
}

interface EventFeedFiltersProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  municipalities: string[];
}

export default function EventFeedFilters({ filters, onFiltersChange, municipalities }: EventFeedFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMunicipalityDropdown, setShowMunicipalityDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMunicipalityDropdown(false);
      }
    };

    if (showMunicipalityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMunicipalityDropdown]);

  const severityOptions: { value: SeverityFilter; label: string }[] = [
    { value: 'all', label: 'Todo' },
    { value: 'critical', label: 'Críticos' },
    { value: 'incidents', label: 'Incidencias' },
    { value: 'evidence', label: 'Evidencias' },
    { value: 'operational', label: 'Operativo' },
  ];

  const eventTypeOptions = [
    { value: 'CHECK_IN', label: 'Check-in' },
    { value: 'INCIDENT', label: 'Incidencia' },
    { value: 'EVIDENCE', label: 'Evidencia' },
    { value: 'TABLE_CLOSE', label: 'Cierre de mesa' },
    { value: 'E14_RECEIVED', label: 'E14 recibido' },
    { value: 'SIGNAL', label: 'Señal' },
  ];

  const timeSegmentOptions = [
    { value: 'all', label: 'Toda la jornada' },
    { value: 'apertura', label: 'Apertura (8:00 - 9:00)' },
    { value: 'manana', label: 'Mañana (9:00 - 12:00)' },
    { value: 'mediodia', label: 'Mediodía (12:00 - 14:00)' },
    { value: 'tarde', label: 'Tarde (14:00 - 16:00)' },
    { value: 'cierre', label: 'Cierre (16:00+)' },
  ];

  const handleSeverityChange = (severity: SeverityFilter) => {
    onFiltersChange({ ...filters, severity });
  };

  const handleMunicipalityChange = (municipality: string) => {
    onFiltersChange({ ...filters, municipality });
    setShowMunicipalityDropdown(false);
  };

  const handleEventTypeToggle = (eventType: string) => {
    const newTypes = new Set(filters.eventTypes);
    if (newTypes.has(eventType)) {
      newTypes.delete(eventType);
    } else {
      newTypes.add(eventType);
    }
    onFiltersChange({ ...filters, eventTypes: newTypes });
  };

  const handleTimeSegmentChange = (timeSegment: string) => {
    onFiltersChange({ ...filters, timeSegment });
  };

  const selectedMunicipalityLabel = filters.municipality === 'all'
    ? 'Todos los municipios'
    : filters.municipality;

  return (
    <div className="flex-shrink-0 border-b border-gray-800/50 pb-3 mb-3">
      <div className="flex items-center gap-1.5 sm:gap-3 mb-3 flex-wrap">
        {severityOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSeverityChange(option.value)}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-medium uppercase tracking-wider war-room-interactive ${
              filters.severity === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
          <button
            onClick={() => setShowMunicipalityDropdown(!showMunicipalityDropdown)}
            className="w-full sm:w-auto px-2 sm:px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 text-[10px] sm:text-[12px] rounded border border-gray-700/50 flex items-center gap-1 sm:gap-2 sm:min-w-[180px] justify-between war-room-interactive"
          >
            <span className="truncate">{selectedMunicipalityLabel}</span>
            <ChevronDown className={`w-3 h-3 flex-shrink-0 war-room-transition ${showMunicipalityDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showMunicipalityDropdown && (
            <div className="absolute top-full left-0 right-0 sm:right-auto mt-1 sm:w-64 bg-gray-900 border border-gray-700 rounded shadow-lg z-10 max-h-64 overflow-y-auto animate-fadeInUp">
              <button
                onClick={() => handleMunicipalityChange('all')}
                className={`w-full px-3 py-2 text-left text-[11px] sm:text-[12px] hover:bg-gray-800 war-room-transition ${
                  filters.municipality === 'all' ? 'bg-gray-800 text-white' : 'text-gray-400'
                }`}
              >
                Todos los municipios
              </button>
              {municipalities.map((mun) => (
                <button
                  key={mun}
                  onClick={() => handleMunicipalityChange(mun)}
                  className={`w-full px-3 py-2 text-left text-[11px] sm:text-[12px] hover:bg-gray-800 war-room-transition ${
                    filters.municipality === mun ? 'bg-gray-800 text-white' : 'text-gray-400'
                  }`}
                >
                  {mun}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-2 sm:px-3 py-1.5 rounded text-[10px] sm:text-[11px] font-medium flex items-center gap-1 sm:gap-2 war-room-interactive ${
            showAdvanced
              ? 'bg-gray-700/50 text-gray-200'
              : 'bg-transparent text-gray-500 hover:text-gray-300 border border-gray-700/50'
          }`}
        >
          <Filter className="w-3 h-3" />
          <span className="hidden sm:inline">Filtros avanzados</span>
          <span className="sm:hidden">Filtros</span>
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-3 p-3 bg-gray-900/50 rounded border border-gray-800/50 space-y-3 animate-fadeInUp">
          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-2 font-medium">Tipo de Evento</div>
            <div className="grid grid-cols-3 gap-2">
              {eventTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-[12px] text-gray-400 cursor-pointer hover:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={filters.eventTypes.has(option.value)}
                    onChange={() => handleEventTypeToggle(option.value)}
                    className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-2 font-medium">Segmento de Tiempo</div>
            <div className="grid grid-cols-2 gap-2">
              {timeSegmentOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-[12px] text-gray-400 cursor-pointer hover:text-gray-300"
                >
                  <input
                    type="radio"
                    name="timeSegment"
                    checked={filters.timeSegment === option.value}
                    onChange={() => handleTimeSegmentChange(option.value)}
                    className="w-3 h-3 border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
