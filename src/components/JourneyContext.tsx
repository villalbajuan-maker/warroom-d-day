interface JourneyContextProps {
  witnessesOperatingPercent: number | null;
  tablesClosedPercent: number | null;
  e14ReceivedPercent: number | null;
  showTablesClosed: boolean;
  showE14: boolean;
}

interface ContextItemProps {
  label: string;
  percent: number | null;
}

function ContextItem({ label, percent }: ContextItemProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-800/20 last:border-0">
      <div className="text-xs text-gray-500 font-medium tracking-wide">
        {label}
      </div>
      <div className="text-base font-semibold text-gray-400 tabular-nums">
        {percent !== null ? `${percent}%` : '—'}
      </div>
    </div>
  );
}

export default function JourneyContext({
  witnessesOperatingPercent,
  tablesClosedPercent,
  e14ReceivedPercent,
  showTablesClosed,
  showE14
}: JourneyContextProps) {
  return (
    <div className="bg-gray-900/15 border border-gray-800/30 rounded-lg p-4">
      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Estado de Operación
      </div>
      <div className="space-y-0">
        <ContextItem
          label="Cobertura Activa"
          percent={witnessesOperatingPercent}
        />
        {showTablesClosed && (
          <ContextItem
            label="Cierre de Mesas"
            percent={tablesClosedPercent}
          />
        )}
        {showE14 && (
          <ContextItem
            label="Recepción Documental"
            percent={e14ReceivedPercent}
          />
        )}
      </div>
    </div>
  );
}
