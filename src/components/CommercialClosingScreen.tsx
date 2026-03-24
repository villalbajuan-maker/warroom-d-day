import { MapPin, Users, AlertTriangle, FileCheck, BarChart3, CheckCircle2, Calendar, MessageCircle, FileText } from 'lucide-react';

interface CommercialClosingScreenProps {
  onContactClick: () => void;
  onImplementClick: () => void;
}

export default function CommercialClosingScreen({ onContactClick, onImplementClick }: CommercialClosingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0a0c0f] via-[#0f1218] to-[#0a0c0f] z-[100] overflow-auto animate-fade-in">
      <div className="min-h-screen flex flex-col">
        <header className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-800/50 animate-slide-in-right">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src="/logo-war-room-transp.png"
              alt="War Room"
              className="h-6 sm:h-8 w-auto opacity-90"
            />
            <div className="h-3 sm:h-4 w-px bg-gray-700"></div>
            <span className="text-gray-400 text-xs sm:text-sm font-medium tracking-wide">Demo Finalizada</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
          <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
            <div className="md:col-span-12 lg:col-span-4 space-y-6 sm:space-y-8 animate-fadeInUp">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-4 sm:mb-6">
                  Hoy viste un Día D completo
                </h2>

                <ul className="space-y-3 sm:space-y-4">
                  <li className="flex items-start space-x-2 sm:space-x-3">
                    <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm sm:text-base">Cobertura territorial real</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-3">
                    <Users className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm sm:text-base">Testigos verificados</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-3">
                    <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm sm:text-base">Incidencias en tiempo real</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-3">
                    <FileCheck className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm sm:text-base">Evidencias con trazabilidad</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-3">
                    <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm sm:text-base">Cierre de mesas y E14</span>
                  </li>
                  <li className="flex items-start space-x-2 sm:space-x-3">
                    <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm sm:text-base">Conteo interno automatizado</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="md:col-span-12 lg:col-span-4 flex flex-col justify-center space-y-6 sm:space-y-8 animate-fadeInUp" style={{ animationDelay: '150ms' }}>
              <div className="space-y-4 sm:space-y-6 text-center">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-50 leading-tight">
                  Esto es War Room.
                </h1>

                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-300 leading-snug">
                  Control electoral en tiempo real,<br />cuando más importa.
                </h2>

                <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto pt-2 sm:pt-4">
                  Lo que acabas de ver no es una simulación genérica.
                  Es exactamente cómo se vive una elección protegida,
                  con datos, evidencia y control.
                </p>
              </div>

              <div className="relative py-6 sm:py-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-lg sm:text-xl font-bold text-gray-100 leading-relaxed">
                  Las elecciones no se repiten.<br />
                  <span className="text-blue-400">La decisión sí.</span>
                </p>
              </div>
            </div>

            <div className="md:col-span-12 lg:col-span-4 flex flex-col justify-center animate-fadeInUp" style={{ animationDelay: '300ms' }}>
              <div className="bg-gradient-to-br from-[#12151a] to-[#0f1115] border border-gray-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <h3 className="text-lg sm:text-xl font-bold text-gray-100 mb-4 sm:mb-6 text-center">
                  Próximo paso
                </h3>

                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <button
                    onClick={onImplementClick}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg war-room-interactive text-sm sm:text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
                    <span>Agendar implementación</span>
                  </button>

                  <button
                    onClick={onContactClick}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-200 rounded-lg war-room-interactive text-sm sm:text-base font-medium flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                    <span>Hablar con un asesor</span>
                  </button>

                  <button
                    onClick={onContactClick}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-transparent hover:bg-gray-800/50 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg war-room-interactive text-sm sm:text-base font-medium flex items-center justify-center space-x-2"
                  >
                    <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
                    <span>Solicitar propuesta</span>
                  </button>
                </div>

                <div className="pt-6 border-t border-gray-800">
                  <p className="text-center text-base font-semibold text-gray-200 mb-2">
                    No dejes tus elecciones al azar
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  Este informe no sustituye resultados oficiales.<br />
                  El conteo interno es una herramienta de análisis privado.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
