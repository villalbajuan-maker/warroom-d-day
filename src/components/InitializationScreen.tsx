import { useState, useEffect } from 'react';

interface InitializationScreenProps {
  onComplete: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'ready';
}

const CHECKLIST_ITEMS = [
  { id: '1', label: 'Alcance electoral configurado' },
  { id: '2', label: 'Territorio validado' },
  { id: '3', label: 'Departamentos en alcance' },
  { id: '4', label: 'Municipios operativos' },
  { id: '5', label: 'Puestos de votación cargados' },
  { id: '6', label: 'Mesas en monitoreo' },
  { id: '7', label: 'Testigos registrados' },
  { id: '8', label: 'Sistema listo' },
];

export default function InitializationScreen({ onComplete }: InitializationScreenProps) {
  const [items, setItems] = useState<ChecklistItem[]>(
    CHECKLIST_ITEMS.map(item => ({ ...item, status: 'pending' as const }))
  );
  const [showFinalMessage, setShowFinalMessage] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    const itemDelay = 400;

    const processNextItem = () => {
      if (currentIndex >= CHECKLIST_ITEMS.length) {
        setShowFinalMessage(true);
        setTimeout(() => {
          onComplete();
        }, 800);
        return;
      }

      setItems(prev => prev.map((item, idx) =>
        idx === currentIndex
          ? { ...item, status: 'processing' }
          : item
      ));

      setTimeout(() => {
        setItems(prev => prev.map((item, idx) =>
          idx === currentIndex
            ? { ...item, status: 'ready' }
            : item
        ));

        currentIndex++;
        setTimeout(processNextItem, itemDelay);
      }, 300);
    };

    const initialDelay = setTimeout(() => {
      processNextItem();
    }, 500);

    return () => clearTimeout(initialDelay);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-[#1a1d23] text-gray-100 flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-2xl px-6">
        <div className="flex flex-col items-center mb-12">
          <img
            src="/logo-war-room-transp.png"
            alt="War Room"
            className="h-16 w-auto mb-3 opacity-90"
          />
          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            Inicializando sistema
          </div>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold text-gray-200 mb-3 tracking-tight">
            Preparando operación del Día D
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Validando configuración electoral y contexto territorial
          </p>
        </div>

        <div className="bg-[#12151a]/60 backdrop-blur-sm rounded-lg border border-gray-800/50 p-8 mb-6">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center space-x-3 transition-all duration-500 ${
                  item.status === 'pending'
                    ? 'opacity-0 translate-y-1'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {item.status === 'ready' && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse"></div>
                  )}
                  {item.status === 'processing' && (
                    <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                  )}
                </div>
                <div
                  className={`text-sm font-medium transition-colors duration-300 ${
                    item.status === 'ready'
                      ? 'text-gray-300'
                      : item.status === 'processing'
                      ? 'text-gray-500'
                      : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {showFinalMessage && (
          <div className="text-center animate-fade-in">
            <div className="text-sm text-emerald-400/90 font-medium tracking-wide">
              Ingresando a la sala de control
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
