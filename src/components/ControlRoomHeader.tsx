import { formatMinuteAsTime } from '../utils/simulated-time';
import HotCorner from './HotCorner';

interface ControlRoomHeaderProps {
  campaignName: string;
  municipalityCount: number;
  currentMinute: number;
  departmentName?: string;
  pollingPlacesCount?: number;
  tablesCount?: number;
  onPresenterModeToggle?: () => void;
  presenterModeEnabled?: boolean;
}

const MAX_MINUTES = 572;

export default function ControlRoomHeader({
  campaignName,
  municipalityCount,
  currentMinute,
  departmentName = "ANTIOQUIA",
  pollingPlacesCount = 0,
  tablesCount = 0,
  onPresenterModeToggle,
  presenterModeEnabled = false
}: ControlRoomHeaderProps) {
  const displayTime = formatMinuteAsTime(currentMinute);
  const progress = Math.min((currentMinute / MAX_MINUTES) * 100, 100);

  const getStatusLabel = () => {
    if (currentMinute >= MAX_MINUTES) return 'JORNADA CERRADA';
    if (currentMinute >= 480) return 'CIERRE DE MESAS';
    return 'DÍA D EN CURSO';
  };

  const getStatusColor = () => {
    if (currentMinute >= MAX_MINUTES) return {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400'
    };
    if (currentMinute >= 480) return {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400'
    };
    return {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400'
    };
  };

  const getDominantColor = () => {
    if (progress < 20) return '#2ECC71';
    if (progress < 40) return '#27AE60';
    if (progress < 55) return '#F39C12';
    if (progress < 70) return '#E67E22';
    if (progress < 85) return '#D35400';
    return '#E74C3C';
  };

  const statusColors = getStatusColor();

  return (
    <header className="sticky top-0 z-50 bg-[#0f1115]/95 backdrop-blur-sm border-b border-gray-800/50">
      {/* Mobile Header */}
      <div className="sm:hidden px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <img
            src="/logo-war-room-transp.png"
            alt="War Room"
            className="h-8 w-auto opacity-90"
          />
          <div className="text-right">
            <div className="text-lg font-bold text-gray-200 tabular-nums">
              {displayTime}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`px-2 py-1 ${statusColors.bg} border ${statusColors.border} rounded text-[10px] font-medium ${statusColors.text} uppercase tracking-wider`}>
            {getStatusLabel()}
          </div>
          <div className="text-xs text-gray-400">
            {municipalityCount} municipios
          </div>
        </div>

        <div className="relative">
          <div className="h-1.5 bg-gray-800/50 rounded-full overflow-hidden">
            <div
              className="h-full war-room-transition"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, #2ECC71 0%, #F1C40F 35%, #E67E22 70%, #E74C3C 100%)`,
                transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Tablet Header */}
      <div className="hidden sm:flex lg:hidden px-6 py-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src="/logo-war-room-transp.png"
            alt="War Room"
            className="h-9 w-auto opacity-90"
          />
          <div>
            <div className="text-base font-semibold text-gray-200">
              {campaignName}
            </div>
            <div className="text-[10px] text-gray-500">
              {municipalityCount} municipios · {tablesCount} mesas
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative war-room-card-hover">
            <div className="w-32 h-2 bg-gray-800/50 rounded-full overflow-hidden">
              <div
                className="h-full war-room-transition"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(to right, #2ECC71 0%, #F1C40F 35%, #E67E22 70%, #E74C3C 100%)`,
                  transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>

          <div className={`px-2 py-1 ${statusColors.bg} border ${statusColors.border} rounded text-[10px] font-medium ${statusColors.text} uppercase tracking-wider`}>
            {getStatusLabel()}
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-gray-200 tabular-nums">
              {displayTime}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex px-8 py-5 items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <img
              src="/logo-war-room-transp.png"
              alt="War Room"
              className="h-10 w-auto opacity-90"
            />
          </div>

          <div className="border-l border-gray-700 pl-8">
            <div className="text-xl font-semibold text-gray-200 mb-0.5 tracking-tight">
              {campaignName}
            </div>
            <div className="text-[11px] text-gray-500 font-normal">
              {departmentName} · {municipalityCount} municipios · {pollingPlacesCount} puestos · {tablesCount} mesas
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative war-room-card-hover">
            <div className="w-64 h-2 bg-gray-800/50 rounded-full overflow-hidden">
              <div
                className="h-full war-room-transition"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(to right, #2ECC71 0%, #F1C40F 35%, #E67E22 70%, #E74C3C 100%)`,
                  boxShadow: `0 0 8px ${getDominantColor()}40`,
                  transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1.5 ${statusColors.bg} border ${statusColors.border} rounded text-[11px] font-medium ${statusColors.text} uppercase tracking-wider`}>
              {getStatusLabel()}
            </div>

            <div className="text-right relative">
              <div className="text-xl font-semibold tracking-tight text-gray-200 tabular-nums">
                {displayTime}
              </div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Hora simulada</div>
              {onPresenterModeToggle && (
                <HotCorner
                  onActivate={onPresenterModeToggle}
                  enabled={presenterModeEnabled}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
