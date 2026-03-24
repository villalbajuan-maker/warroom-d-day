import { FileCheck, AlertTriangle, FileText, CheckCircle, XCircle, ArrowLeft, Download, ShieldAlert, BarChart3, AlertCircle } from 'lucide-react';
import type { FinalReportData } from '../hooks/useFinalReport';
import AnimatedCounter from './AnimatedCounter';

interface FinalReportProps {
  data: FinalReportData;
  campaignName: string;
  onClose: () => void;
  onFinishDemo: () => void;
}

export default function FinalReport({ data, campaignName, onClose, onFinishDemo }: FinalReportProps) {
  const coveragePercentage = ((data.tables_covered / data.total_tables) * 100).toFixed(1);
  const e14Percentage = ((data.e14_received / data.tables_covered) * 100).toFixed(1);
  const witnessPresencePercentage = ((data.witnesses_present / data.total_witnesses) * 100).toFixed(1);
  const electionDate = "29 de Enero, 2026";

  const handleDownload = (type: 'executive' | 'e14' | 'complete') => {
    console.log(`Downloading ${type} report...`);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] animate-fade-in">
      <div className="sticky top-0 bg-[#12151a] border-b border-gray-800 shadow-lg z-50 backdrop-blur-sm bg-[#12151a]/95 animate-slide-in-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-6 w-full lg:w-auto">
              <img
                src="/logo-war-room-transp.png"
                alt="War Room"
                className="h-8 sm:h-10 w-auto"
              />
              <div className="hidden sm:block border-l border-gray-700 h-8 sm:h-12"></div>
              <div className="flex-1 lg:flex-initial">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3">
                  <h1 className="text-base sm:text-xl font-bold text-gray-100">Informe Final de Jornada</h1>
                  <div className="px-2 sm:px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full self-start">
                    <span className="text-[10px] sm:text-xs font-semibold text-blue-400">Jornada Finalizada</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:space-x-4 mt-1 text-xs sm:text-sm text-gray-400">
                  <span className="font-medium">{campaignName}</span>
                  <span className="hidden sm:inline text-gray-600">•</span>
                  <span>{electionDate}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload('executive')}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-lg war-room-interactive text-xs sm:text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Download className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => handleDownload('complete')}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg war-room-interactive text-xs sm:text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Download className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span>ZIP</span>
                </button>
              </div>

              <div className="hidden sm:block border-l border-gray-700 h-8"></div>

              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg war-room-interactive text-xs sm:text-sm font-medium flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-3 sm:w-4 h-3 sm:h-4" />
                <span>Volver</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="space-y-8">
            {/* BLOCK 0 — CIERRE DE JORNADA */}
            <div className="bg-blue-950/10 border border-blue-500/20 rounded-lg p-4 sm:p-6 animate-fadeInUp">
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                La jornada electoral fue monitoreada en tiempo real, respaldada con evidencia documental y análisis automatizado.
              </p>
            </div>

            {/* BLOCK 1 — ESTADO FINAL DE LA JORNADA */}
            <div className="bg-[#12151a] border border-gray-800 rounded-lg p-4 sm:p-6 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
              <h2 className="text-xs sm:text-sm font-bold text-gray-200 uppercase tracking-wider mb-4 sm:mb-5">
                Estado Final de la Jornada
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 war-room-card-hover">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Mesas Cerradas</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {data.tables_closed} / {data.tables_covered}
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 war-room-card-hover">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Formularios E14</span>
                  </div>
                  <AnimatedCounter value={data.e14_received} className="text-2xl font-bold text-emerald-400 inline" /> / {data.tables_covered}
                </div>

                <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 war-room-card-hover">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Testigos Presentes</span>
                  </div>
                  <div className="text-2xl font-bold text-teal-400">
                    {data.witnesses_present} / {data.total_witnesses}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{witnessPresencePercentage}%</div>
                </div>

                <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 war-room-card-hover">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Incidencias Totales</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{data.total_incidents}</div>
                  {data.critical_incidents > 0 && (
                    <div className="text-xs text-red-400 mt-1">{data.critical_incidents} críticas</div>
                  )}
                </div>
              </div>
            </div>

            {/* BLOCK 2 — ANÁLISIS AUTOMATIZADO DE EVIDENCIA E14 */}
            <div className="bg-[#12151a] border border-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-5">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                  Análisis Automatizado de Evidencia E14
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-gray-300 font-medium">
                    {data.e14_received} / {data.tables_covered} formularios E14 procesados
                  </span>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed">
                  Los formularios E14 fueron analizados mediante un proceso automatizado de extracción y validación de datos a partir de evidencia documental enviada por los testigos.
                </p>

                <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 space-y-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Indicadores de Calidad</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Calidad promedio de imágenes</div>
                      <div className="text-emerald-400 font-semibold">Alta (92%)</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Nivel de confianza del análisis</div>
                      <div className="text-emerald-400 font-semibold">Alto (94%)</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Advertencias de calidad</div>
                      <div className="text-yellow-400 font-semibold">2 formularios</div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-4 flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300 leading-relaxed">
                    <span className="font-semibold text-amber-400">Advertencia Legal:</span> Este análisis no constituye un resultado oficial. Es un ejercicio de inteligencia electoral privada basado en evidencia documental.
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCK 3 — CONTEO INTERNO DE VOTOS (PRIVADO) */}
            <div className="bg-[#12151a] border border-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-5">
                <FileCheck className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                  Conteo Interno de Votos (Privado)
                </h2>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400 font-medium">Candidato A</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-blue-400">2,847</span>
                        <span className="text-sm text-gray-500">(42.3%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400 font-medium">Candidato B</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-emerald-400">2,613</span>
                        <span className="text-sm text-gray-500">(38.8%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400 font-medium">Candidato C</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-teal-400">1,273</span>
                        <span className="text-sm text-gray-500">(18.9%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 pt-4">
                      <span className="text-gray-300 font-semibold">Total Votos Contados</span>
                      <span className="text-2xl font-bold text-gray-200">6,733</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span>Margen de confianza: ±1.8%</span>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-4 flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300 leading-relaxed">
                    <span className="font-semibold text-amber-400">Importante:</span> Este conteo es un insumo estratégico para la campaña y no reemplaza el escrutinio oficial.
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCK 4 — INCIDENCIAS RELEVANTES */}
            <div className="bg-[#12151a] border border-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-5">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                  Incidencias Relevantes
                </h2>
              </div>

              <div className="grid grid-cols-5 gap-3 mb-5">
                <div className="text-center p-4 bg-gray-900/50 rounded border border-gray-700">
                  <div className="text-2xl font-bold text-gray-300">{data.total_incidents}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total</div>
                </div>
                <div className="text-center p-4 bg-red-950/30 rounded border border-red-500/30">
                  <div className="text-2xl font-bold text-red-400">{data.critical_incidents}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Críticas</div>
                </div>
                <div className="text-center p-4 bg-orange-950/30 rounded border border-orange-500/30">
                  <div className="text-2xl font-bold text-orange-400">{data.high_incidents}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Altas</div>
                </div>
                <div className="text-center p-4 bg-yellow-950/30 rounded border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">{data.medium_incidents}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Medias</div>
                </div>
                <div className="text-center p-4 bg-gray-900/50 rounded border border-gray-700">
                  <div className="text-2xl font-bold text-gray-400">{data.low_incidents}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Bajas</div>
                </div>
              </div>

              {data.critical_incidents > 0 && (
                <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4">
                  <div className="text-sm text-gray-300 leading-relaxed">
                    Se registraron <span className="font-semibold text-red-400">{data.critical_incidents} incidencias críticas</span> que requieren atención inmediata y pueden haber afectado el proceso electoral en las mesas correspondientes.
                  </div>
                </div>
              )}
            </div>

            {/* BLOCK 5 — RESUMEN TERRITORIAL */}
            <div className="bg-[#12151a] border border-gray-800 rounded-lg p-6">
              <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-5">
                Resumen Territorial
              </h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.municipalities_summary.map((mun) => (
                  <div
                    key={mun.municipality_name}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded border border-gray-700 war-room-card-hover"
                  >
                    <div className="font-semibold text-gray-300">{mun.municipality_name}</div>
                    <div className="flex items-center space-x-8 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Mesas cerradas:</span>
                        <span className="font-semibold text-blue-400">{mun.tables_closed}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">E14 recibidos:</span>
                        <span className="font-semibold text-emerald-400">{mun.e14_received}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Incidencias:</span>
                        <span className={`font-semibold ${mun.incidents > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {mun.incidents}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BLOCK 6 — ENTREGABLES FINALES */}
            <div className="bg-[#12151a] border border-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-5">
                <Download className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                  Entregables Finales
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleDownload('executive')}
                  className="flex items-center justify-center space-x-3 p-5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-lg war-room-card-hover group"
                >
                  <FileText className="w-6 h-6 text-blue-400 group-hover:scale-110 war-room-transition" />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-blue-400">Informe Ejecutivo</div>
                    <div className="text-xs text-gray-500">PDF completo</div>
                  </div>
                </button>

                <button
                  onClick={() => handleDownload('e14')}
                  className="flex items-center justify-center space-x-3 p-5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg war-room-card-hover group"
                >
                  <BarChart3 className="w-6 h-6 text-emerald-400 group-hover:scale-110 war-room-transition" />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-emerald-400">Análisis de E14</div>
                    <div className="text-xs text-gray-500">CSV / Excel</div>
                  </div>
                </button>

                <button
                  onClick={() => handleDownload('complete')}
                  className="flex items-center justify-center space-x-3 p-5 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/30 hover:border-gray-500/50 rounded-lg war-room-card-hover group"
                >
                  <Download className="w-6 h-6 text-gray-400 group-hover:scale-110 war-room-transition" />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-400">Repositorio Completo</div>
                    <div className="text-xs text-gray-500">ZIP con todo</div>
                  </div>
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500 leading-relaxed">
                El archivo ZIP incluye: informe ejecutivo, análisis de E14, conteo interno, evidencias por municipio, datos procesados y documentación metodológica.
              </div>
            </div>

            <div className="flex justify-center pt-8 pb-12">
              <button
                onClick={onFinishDemo}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg war-room-interactive text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                Finalizar demo
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
