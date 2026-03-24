import { useState, useEffect } from 'react';
import { FileCheck, Loader2 } from 'lucide-react';

const STATUS_MESSAGES = [
  "Verificando cierre de mesas",
  "Procesando formularios E14",
  "Analizando evidencias recibidas",
  "Calculando conteo interno",
  "Preparando informe final"
];

interface ReportGenerationScreenProps {
  onComplete: () => void;
}

export default function ReportGenerationScreen({ onComplete }: ReportGenerationScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setFadeIn(false);

      setTimeout(() => {
        setCurrentMessageIndex((prev) => {
          if (prev >= STATUS_MESSAGES.length - 1) {
            return prev;
          }
          return prev + 1;
        });
        setFadeIn(true);
      }, 300);
    }, 1500);

    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 7500);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0a0c0f] z-50 flex items-center justify-center animate-fade-in">
      <div className="text-center max-w-2xl px-8 animate-fadeInUp">
        <div className="relative mb-8">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse"></div>

            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <FileCheck className="w-10 h-10 text-blue-300" />
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-12">
          <h2 className="text-3xl font-bold text-gray-100">
            Generando informe final
          </h2>

          <p className="text-lg text-gray-400">
            Consolidando datos, evidencias y actas recibidas…
          </p>
        </div>

        <div className="min-h-[60px] flex items-center justify-center mb-16">
          <div
            className={`transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-base font-medium">
                {STATUS_MESSAGES[currentMessageIndex]}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            Este proceso asegura la integridad y trazabilidad del informe.
          </p>
        </div>
      </div>
    </div>
  );
}
