import React, { useRef } from 'react';
import { ParetoAnalysisResult, DowntimeRecord, TimeUnit } from '../types/downtime';
import { formatHoursDecimal, formatDuration } from '../utils/dateUtils';
import { Printer, FileText } from 'lucide-react';
import { ExportPngButton } from './ExportPngButton';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DowntimeRecord[];
  problemAnalysis: ParetoAnalysisResult;
  lineAnalysis: ParetoAnalysisResult;
  weekAnalysis: ParetoAnalysisResult;
  timeUnit?: TimeUnit;
  onOpenDailyPdfReport?: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  records,
  problemAnalysis,
  lineAnalysis,
  weekAnalysis,
  timeUnit = 'hours',
  onOpenDailyPdfReport,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  if (!isOpen) return null;

  const totalMinutes = records.reduce((acc, r) => acc + r.durationMinutes, 0);
  const mttr = records.length > 0 ? totalMinutes / records.length : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:m-0 print:rounded-none">
        {/* Top actions sticky header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white print:hidden flex-wrap gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Informe Ejecutivo de Tiempo Muerto & Pareto 80/20
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generado para junta de operaciones y gerencia de planta
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenDailyPdfReport && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDailyPdfReport();
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Generar reporte de un día específico en .pdf"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Reporte Diario .PDF</span>
                <span className="sm:hidden">.PDF</span>
              </button>
            )}

            <ExportPngButton
              targetRef={contentRef}
              export1080Config={{
                title: 'Reporte Ejecutivo de Ingeniería de Planta',
                subtitle: `Auditoría Integral de Tiempo Muerto y Análisis Pareto 80/20 · ${records.length} registros`,
                legendItems: [
                  { label: 'Causas Vitales (80% crítico)', color: '#2563eb', type: 'rect' },
                  { label: 'Causas Secundarias', color: '#cbd5e1', type: 'rect' },
                ],
                element: contentRef.current,
                footerNote: 'Sistema de Control de Tiempo Muerto · Informe Ejecutivo de Ingeniería para Presentación',
              }}
              filename={`informe_ejecutivo_pareto_1080p_full_hd.png`}
              label="Descargar Informe PNG (1080p Full HD)"
              variant="secondary"
              tooltip="Guardar informe completo en alta resolución 1080p Full HD (1920x1080) para diapositivas de presentación"
            />

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Scrollable Content */}
        <div ref={contentRef} className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800 bg-white print:overflow-visible print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                REPORTE DE INGENIERÍA DE PLANTA
              </h2>
              <p className="text-xs text-slate-500">
                Auditoría de Inactividad y Diagramas de Pareto por Falla y Línea
              </p>
            </div>
            <div className="text-right font-mono text-[11px] text-slate-500">
              <div>Fecha: {new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</div>
              <div>Alcance: {records.length} paros auditados</div>
            </div>
          </div>

          {/* Plant Core Metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 font-sans block font-medium">
                Tiempo Muerto Total
              </span>
              <span className="text-base font-bold text-slate-900">
                {formatDuration(totalMinutes, timeUnit)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-sans block font-medium">
                Total de Eventos de Paro
              </span>
              <span className="text-base font-bold text-slate-900">
                {records.length} incidentes
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-sans block font-medium">
                MTTR Promedio (Tiempo Reparación)
              </span>
              <span className="text-base font-bold text-blue-700">
                {timeUnit === 'minutes' ? `${Math.round(mttr)} min / evento` : `${(mttr / 60).toFixed(2)} h / evento`}
              </span>
            </div>
          </div>

          {/* Pareto Vital Few Section */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              1. Causas Raíz Vitales (El 80% del Tiempo Muerto Total)
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Problema Encontrado</th>
                    <th className="py-2.5 px-3 text-right">Tiempo Muerto</th>
                    <th className="py-2.5 px-3 text-right">Eventos</th>
                    <th className="py-2.5 px-3 text-right">% Individual</th>
                    <th className="py-2.5 px-3 text-right">% Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {problemAnalysis.items.slice(0, 6).map((item, idx) => (
                    <tr
                      key={item.key}
                      className={item.isVitalFew ? 'bg-blue-50/20' : ''}
                    >
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-sans font-bold text-slate-900">
                        {item.label}
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        {formatDuration(item.value, timeUnit)}
                      </td>
                      <td className="py-2 px-3 text-right">{item.count}</td>
                      <td className="py-2 px-3 text-right text-blue-700 font-bold">
                        {item.percentage.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right text-indigo-700 font-bold">
                        {item.cumulativePercentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pareto By Line & Week Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                2. Distribución de Paro por Línea
              </h4>
              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                {lineAnalysis.items.map((line) => (
                  <div key={line.key} className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                      {line.label}
                    </span>
                    <div className="flex items-center gap-3 font-mono">
                      <span>{formatDuration(line.value, timeUnit)}</span>
                      <span className="text-blue-700 font-bold w-12 text-right">
                        {line.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                3. Semanas con Mayor Impacto
              </h4>
              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                {weekAnalysis.items.slice(0, 5).map((w) => (
                  <div key={w.key} className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-800">
                      {w.label}
                    </span>
                    <div className="flex items-center gap-3 font-mono">
                      <span>{formatDuration(w.value, timeUnit)}</span>
                      <span className="text-blue-700 font-bold w-12 text-right">
                        {w.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plan of Action Recommendation */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs font-bold text-blue-900 mb-1">
              Conclusión y Recomendación de Ingeniería:
            </h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              Atacar las dos primeras causas ({problemAnalysis.items[0]?.label || 'Causa 1'} y{' '}
              {problemAnalysis.items[1]?.label || 'Causa 2'}) permitirá recuperar más del 40% del tiempo perdido en planta. Se recomienda abrir evento Kaizen de 3 días con los líderes de mantenimiento de las máquinas críticas.
            </p>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            {records.length} registros auditados
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
