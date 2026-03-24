import { useState, useRef, useEffect } from 'react';
import { X, GripVertical } from 'lucide-react';
import PresenterControls from './PresenterControls';
import { formatMinuteAsTime } from '../utils/simulated-time';

interface DraggablePresenterPanelProps {
  currentMinute: number | null;
  isRunning: boolean;
  speed: 1 | 2 | 4 | 8;
  onMinuteChange: (minute: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: 1 | 2 | 4 | 8) => void;
  onClose: () => void;
}

export default function DraggablePresenterPanel(props: DraggablePresenterPanelProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      if (panelRef.current) {
        const panelWidth = panelRef.current.offsetWidth;
        const panelHeight = panelRef.current.offsetHeight;

        const maxX = window.innerWidth - panelWidth;
        const maxY = window.innerHeight - panelHeight;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed bg-blue-950/95 backdrop-blur-sm border-2 border-blue-500/50 rounded-lg shadow-2xl z-[100] animate-fadeInUp"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '600px',
        maxWidth: '90vw',
        transition: isDragging ? 'none' : 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-blue-500/30 cursor-move select-none bg-blue-900/30 hover:bg-blue-900/40 war-room-transition"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-blue-400 animate-pulse" />
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
              Timeline - Modo Presentador
            </span>
            <div className="px-2 py-0.5 bg-blue-500/20 rounded text-[11px] font-semibold text-blue-300">
              {props.speed}X
            </div>
          </div>
        </div>
        <button
          onClick={props.onClose}
          className="p-1 rounded hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 war-room-transition"
          title="Cerrar (Cmd/Ctrl+Shift+T)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4">
        <PresenterControlsContent {...props} />
      </div>
    </div>
  );
}

function PresenterControlsContent({
  currentMinute,
  isRunning,
  speed,
  onMinuteChange,
  onPlay,
  onPause,
  onReset,
  onSpeedChange
}: Omit<DraggablePresenterPanelProps, 'onClose'>) {
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    if (currentMinute !== null) {
      const percentage = (currentMinute / 572) * 100;
      setSliderValue(percentage);
    }
  }, [currentMinute]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value);
    setSliderValue(percentage);
    const newMinute = Math.round((percentage / 100) * 572);
    onMinuteChange(newMinute);
  };

  if (currentMinute === null) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={isRunning ? onPause : onPlay}
            className={`px-4 py-2 rounded font-semibold text-sm war-room-interactive ${
              isRunning
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? 'Pausar' : 'Play'}
          </button>
          <button
            onClick={onReset}
            disabled={isRunning}
            className="px-4 py-2 rounded font-semibold text-sm war-room-interactive bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Velocidad:</span>
          <div className="flex items-center space-x-1 bg-gray-900/50 rounded p-1">
            {([1, 2, 4, 8] as const).map((speedOption) => (
              <button
                key={speedOption}
                onClick={() => onSpeedChange(speedOption)}
                className={`px-2 py-1 rounded text-xs font-semibold war-room-transition ${
                  speed === speedOption
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                {speedOption}X
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Minuto {currentMinute} / 572</span>
          <span className="text-lg font-bold text-white font-mono">{formatMinuteAsTime(currentMinute)}</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={sliderValue}
          onChange={handleSliderChange}
          disabled={isRunning}
          className={`w-full h-2 bg-gray-800 rounded-lg appearance-none accent-blue-500 ${
            isRunning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sliderValue}%, #1f2937 ${sliderValue}%, #1f2937 100%)`
          }}
        />

        <div className="flex justify-between text-xs text-gray-400">
          <span>08:00 - Inicio</span>
          <span>12:46 - Mediodía</span>
          <span>17:32 - Cierre</span>
        </div>
      </div>
    </div>
  );
}
