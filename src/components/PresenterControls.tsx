import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import {
  formatMinuteAsTime,
  calculateMinuteProgressPercentage,
  calculateMinuteFromPercentage,
  getDemoKeyMinutes
} from '../utils/simulated-time';

interface PresenterControlsProps {
  currentMinute: number | null;
  isRunning: boolean;
  speed: 1 | 2 | 4 | 8;
  onMinuteChange: (minute: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: 1 | 2 | 4 | 8) => void;
}

export default function PresenterControls({
  currentMinute,
  isRunning,
  speed,
  onMinuteChange,
  onPlay,
  onPause,
  onReset,
  onSpeedChange
}: PresenterControlsProps) {
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    if (currentMinute !== null) {
      const percentage = calculateMinuteProgressPercentage(currentMinute);
      setSliderValue(percentage);
    }
  }, [currentMinute]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value);
    setSliderValue(percentage);

    const newMinute = calculateMinuteFromPercentage(percentage);
    onMinuteChange(newMinute);
  };

  if (currentMinute === null) {
    return null;
  }

  const keyMinutes = getDemoKeyMinutes();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-950/95 backdrop-blur-sm border-t-2 border-blue-500 p-6 z-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
              MODO PRESENTADOR - Control de Timeline
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={isRunning ? onPause : onPlay}
                className={`p-2 rounded transition-colors ${
                  isRunning
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                }`}
                title={isRunning ? 'Pausar' : 'Reproducir'}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={onReset}
                disabled={isRunning}
                className="p-2 rounded transition-colors bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reiniciar"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center space-x-1 bg-gray-900/50 rounded p-1">
              {([1, 2, 4, 8] as const).map((speedOption) => (
                <button
                  key={speedOption}
                  onClick={() => onSpeedChange(speedOption)}
                  className={`px-3 py-1 rounded text-[13px] font-semibold transition-colors ${
                    speed === speedOption
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {speedOption}X
                </button>
              ))}
            </div>
          </div>
          <div className="text-xl font-semibold text-white font-mono tracking-tight">{formatMinuteAsTime(currentMinute)}</div>
        </div>

        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={sliderValue}
            onChange={handleSliderChange}
            disabled={isRunning}
            className={`w-full h-3 bg-gray-800 rounded-lg appearance-none accent-blue-500 ${
              isRunning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sliderValue}%, #1f2937 ${sliderValue}%, #1f2937 100%)`
            }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-gray-400 mt-2 font-medium">
          <span>{formatMinuteAsTime(keyMinutes.start)} - Inicio de jornada</span>
          <span>{formatMinuteAsTime(keyMinutes.midpoint)} - Mediodía</span>
          <span>{formatMinuteAsTime(keyMinutes.end)} - Cierre</span>
        </div>
      </div>
    </div>
  );
}
