import React, { useRef } from 'react';
import { ParetoItem, ParetoMetric, TimeUnit } from '../types/downtime';
import { formatHoursDecimal } from '../utils/dateUtils';
import { ExportPngButton } from './ExportPngButton';
import { exportTo1080pFullHdPng } from '../utils/exportToPng';

interface ParetoTableProps {
  items: ParetoItem[];
  metric: ParetoMetric;
  timeUnit?: TimeUnit;
  totalValue: number;
  onSelectRow?: (item: ParetoItem) => void;
  selectedKey?: string | null;
  groupByLabel: string;
}

export const ParetoTable: React.FC<ParetoTableProps> = ({
  items,
  metric,
  timeUnit = 'hours',
  totalValue,
  onSelectRow,
  selectedKey,
  groupByLabel,
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const rawTableRef = useRef<HTMLTableElement>(null);

  const formatTotal = () => {
    if (metric === 'duration') {
      return timeUnit === 'minutes'
        ? `${Math.round(totalValue).toLocaleString('es-MX')} min`
        : formatHoursDecimal(totalValue);
    }
    return `${Math.round(totalValue)} paros`;
  };

  const handleExport1080 = async () => {
    await exportTo1080pFullHdPng({
      filename: `tabla_pareto_${groupByLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_1080p_full_hd.png`,
      title: `Tabla de Distribución Pareto 80/20 · Por ${groupByLabel}`,
      subtitle: `Orden descendente por impacto acumulado · ${items.length} elementos analizados · Total: ${formatTotal()}`,
      legendItems: [
        { label: 'Causas Vitales (80% impacto crítico)', color: '#2563eb', type: 'rect' },
        { label: 'Causas Secundarias', color: '#94a3b8', type: 'rect' },
      ],
      kpis: [
        { label: 'Total Acumulado', value: formatTotal() },
        { label: 'Elementos', value: `${items.length}` },
      ],
      tableElement: rawTableRef.current,
      element: tableRef.current,
      footerNote: 'Sistema de Control de Tiempo Muerto · Tabla de Distribución Pareto para Presentación',
    });
  };

  return (
    <div ref={tableRef} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs mt-6">
      {/* Header with Title and Legend strictly in the upper-left corner */}
      <div className="px-6 py-3.5 border-b border-slate-100 flex items-start justify-between bg-white flex-wrap gap-3">
        {/* Esquina superior izquierda */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            Tabla de Distribución Pareto 80/20 ({groupByLabel})
          </h4>
          <p className="text-xs text-slate-500">
            Orden descendente por impacto acumulado · Total analizado: {formatTotal()}
          </p>

          {/* Leyenda en la esquina superior izquierda */}
          <div className="flex items-center gap-3 text-xs font-medium pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block shadow-2xs"></span>
              <span className="text-slate-800 font-semibold">Zona Vital (80% crítico)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block"></span>
              <span className="text-slate-500">Zona Secundaria</span>
            </div>
          </div>
        </div>

        {/* Acciones en la esquina superior derecha */}
        <div className="flex items-center gap-2.5 self-start">
          <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md font-mono font-bold">
            {items.length} elementos
          </span>
          <ExportPngButton
            targetRef={tableRef}
            onCustomExport={handleExport1080}
            filename={`tabla_pareto_${groupByLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_1080p_full_hd.png`}
            label="Descargar Tabla PNG (1080p Full HD)"
            tooltip="Guardar tabla completa Pareto en alta resolución 1080p Full HD (1920x1080) para diapositivas de presentación"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table ref={rawTableRef} className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">{groupByLabel}</th>
              {items.some((i) => i.category) && (
                <th className="py-3 px-4 w-36">Categoría</th>
              )}
              <th className="py-3 px-4 text-right">
                {metric === 'duration'
                  ? timeUnit === 'minutes'
                    ? 'Tiempo Muerto (min)'
                    : 'Tiempo Muerto (h)'
                  : 'Frecuencia'}
              </th>
              <th className="py-3 px-4 text-right">Eventos</th>
              <th className="py-3 px-4 text-right w-40">% Individual</th>
              <th className="py-3 px-4 text-right">% Acumulado</th>
              <th className="py-3 px-4 text-center w-28">Clasificación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {items.map((item, index) => {
              const isSelected = selectedKey === item.key;
              return (
                <tr
                  key={item.key}
                  onClick={() => onSelectRow && onSelectRow(item)}
                  className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${
                    isSelected
                      ? 'bg-blue-50'
                      : item.isVitalFew
                      ? 'bg-blue-50/20'
                      : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center text-slate-400 font-semibold">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 font-sans font-bold text-slate-900">
                    {item.label}
                  </td>
                  {items.some((i) => i.category) && (
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                        {item.category || '-'}
                      </span>
                    </td>
                  )}
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {metric === 'duration'
                      ? timeUnit === 'minutes'
                        ? `${Math.round(item.value).toLocaleString('es-MX')} min`
                        : formatHoursDecimal(item.value)
                      : `${item.count} paros`}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 font-medium">
                    {item.count}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.isVitalFew ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-semibold text-slate-800">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span
                      className={
                        item.cumulativePercentage <= 80
                          ? 'text-blue-700'
                          : 'text-slate-600'
                      }
                    >
                      {item.cumulativePercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    {item.isVitalFew ? (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        ⚡ Vital (80%)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Secundario</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
