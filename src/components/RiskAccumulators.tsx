import { AlertTriangle, Eye, FileWarning, Activity } from 'lucide-react';

interface RiskAccumulatorsProps {
  criticalRisks: number;
  tablesUnderObservation: number;
  sensitiveEvidence: number;
  operationalSignals: number;
}

interface AccumulatorCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant: 'critical' | 'observation' | 'sensitive' | 'operational';
  isHighlighted?: boolean;
}

function AccumulatorCard({ icon, label, value, variant, isHighlighted = false }: AccumulatorCardProps) {
  const hasValue = value > 0;

  let borderClass = 'border-gray-800/40';
  let bgClass = 'bg-gray-900/20';
  let valueClass = 'text-gray-500';
  let iconWrapperClass = 'bg-gray-800/20';
  let iconColorClass = 'text-gray-600';

  if (hasValue) {
    switch (variant) {
      case 'critical':
        borderClass = 'border-red-500/60';
        bgClass = 'bg-red-950/30';
        valueClass = 'text-red-300';
        iconWrapperClass = 'bg-red-500/25';
        iconColorClass = 'text-red-400';
        break;
      case 'observation':
        borderClass = 'border-orange-500/50';
        bgClass = 'bg-orange-950/20';
        valueClass = 'text-orange-300';
        iconWrapperClass = 'bg-orange-500/20';
        iconColorClass = 'text-orange-400';
        break;
      case 'sensitive':
        borderClass = 'border-yellow-600/50';
        bgClass = 'bg-yellow-950/15';
        valueClass = 'text-yellow-400/90';
        iconWrapperClass = 'bg-yellow-600/20';
        iconColorClass = 'text-yellow-500/90';
        break;
      case 'operational':
        borderClass = 'border-gray-700/40';
        bgClass = 'bg-gray-900/25';
        valueClass = 'text-gray-400';
        iconWrapperClass = 'bg-gray-700/25';
        iconColorClass = 'text-gray-500';
        break;
    }
  }

  const animationClass = isHighlighted && hasValue && variant === 'critical'
    ? 'animate-riskPulse'
    : '';

  return (
    <div className={`rounded-lg border ${borderClass} ${bgClass} p-3 transition-all duration-500 ${animationClass}`}>
      <div className="flex items-center space-x-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${iconWrapperClass} flex items-center justify-center transition-all duration-500`}>
          <div className={iconColorClass}>
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-0.5">
            {label}
          </div>
          <div className={`text-2xl font-bold ${valueClass} transition-colors duration-500`}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RiskAccumulators({
  criticalRisks,
  tablesUnderObservation,
  sensitiveEvidence,
  operationalSignals
}: RiskAccumulatorsProps) {
  const hasCriticalRisk = criticalRisks > 0;

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
        Acumuladores de Riesgo
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        <AccumulatorCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Riesgos Críticos Activos"
          value={criticalRisks}
          variant="critical"
          isHighlighted={hasCriticalRisk}
        />
        <AccumulatorCard
          icon={<Eye className="w-5 h-5" />}
          label="Mesas Bajo Observación"
          value={tablesUnderObservation}
          variant="observation"
        />
        <AccumulatorCard
          icon={<FileWarning className="w-5 h-5" />}
          label="Evidencias Sensibles"
          value={sensitiveEvidence}
          variant="sensitive"
        />
        <AccumulatorCard
          icon={<Activity className="w-5 h-5" />}
          label="Señales Operativas"
          value={operationalSignals}
          variant="operational"
        />
      </div>
    </div>
  );
}
