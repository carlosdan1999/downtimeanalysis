import React, { useState, useMemo, useRef } from 'react';
import { DowntimeRecord, TimeUnit } from '../types/downtime';
import { calculatePareto } from '../utils/pareto';
import { formatDateLabel, formatDuration, formatHoursDecimal } from '../utils/dateUtils';
import { generateDailyReportPdf } from '../utils/dailyPdfGenerator';
import { ExportPngButton } from './ExportPngButton';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  X,
  Clock,
  Activity,
  Factory,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface DailyReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DowntimeRecord[];
  timeUnit?: TimeUnit;
}

export const DailyReportPdfModal: React.FC<DailyReportPdfModalProps> = ({
  isOpen,
  onClose,
  records,
  timeUnit = 'hours',
}) => {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // Extract all unique dates with downtime events, sorted descending
  const datesWithRecords = useMemo(() => {
    const map = new Map<string, { count: number; minutes: number }>();
    records.forEach((r) => {
      if (!r.date) return;
      const cur = map.get(r.date) || { count: 0, minutes: 0 };
      cur.count += 1;
      cur.minutes += r.durationMinutes;
      map.set(r.date, cur);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, data]) => ({
        date,
        count: data.count,
        minutes: data.minutes,
      }));
  }, [records]);

  // Default to the most recent date with records, or today's date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (datesWithRecords.length > 0) {
      return datesWithRecords[0].date;
    }
    return new Date().toISOString().slice(0, 10);
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Day records filtered
  const dayRecords = useMemo(() => {
    return records.filter((r) => r.date === selectedDate);
  }, [records, selectedDate]);

  // Pareto by line calculation for this day
  const lineAnalysis = useMemo(() => {
    return calculatePareto(dayRecords, 'line', 'duration');
  }, [dayRecords]);

  const totalMinutes = useMemo(() => {
    return dayRecords.reduce((acc, r) => acc + r.durationMinutes, 0);
  }, [dayRecords]);

  const totalEvents = dayRecords.length;
  const mttrMinutes = totalEvents > 0 ? totalMinutes / totalEvents : 0;
  const affectedLinesCount = lineAnalysis.items.length;

  if (!isOpen) return null;

  // Handle PDF file generation and download
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = generateDailyReportPdf({
        date: selectedDate,
        records,
        timeUnit,
      });
      const fileName = `Reporte_Diario_Tiempo_Muerto_${selectedDate}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error('Error generating PDF', e);
      alert('Hubo un error al generar el archivo PDF. Intenta imprimir desde el navegador.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Date step helpers
  const handlePrevDay = () => {
    const curIndex = datesWithRecords.findIndex((d) => d.date === selectedDate);
    if (curIndex >= 0 && curIndex < datesWithRecords.length - 1) {
      setSelectedDate(datesWithRecords[curIndex + 1].date);
    } else {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().slice(0, 10));
    }
  };

  const handleNextDay = () => {
    const curIndex = datesWithRecords.findIndex((d) => d.date === selectedDate);
    if (curIndex > 0) {
      setSelectedDate(datesWithRecords[curIndex - 1].date);
    } else {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().slice(0, 10));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:m-0 print:rounded-none animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Header with Actions & Date Selection */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Generador de Reporte Diario en PDF
              </h3>
              <p className="text-xs text-slate-500">
                Tiempo muerto total, Pareto por línea, causas raíz y acciones correctivas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            {/* Direct .PDF file download button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || dayRecords.length === 0}
              className={`px-3.5 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                dayRecords.length === 0
                  ? 'bg-slate-300 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
              }`}
              title="Descargar archivo .pdf"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generando...' : 'Descargar .pdf'}</span>
            </button>

            {/* Direct .PNG image export button */}
            {dayRecords.length > 0 && (
              <ExportPngButton
                targetRef={previewContainerRef}
                export1080Config={{
                  title: `Reporte Diario de Paros y Tiempos Muertos (${selectedDate})`,
                  subtitle: `Total tiempo muerto: ${formatDuration(totalMinutes, timeUnit)} · ${dayRecords.length} paros registrados`,
                  legendItems: [
                    { label: 'Causas Vitales (80% crítico)', color: '#2563eb', type: 'rect' },
                    { label: 'Causas Secundarias', color: '#cbd5e1', type: 'rect' },
                  ],
                  element: previewContainerRef.current,
                  footerNote: 'Sistema de Control de Tiempo Muerto · Reporte Diario de Operaciones',
                }}
                filename={`reporte_diario_pareto_${selectedDate}_1080p_full_hd.png`}
                label="Descargar .png (1080p Full HD)"
                variant="secondary"
                tooltip="Guardar reporte diario completo en alta resolución 1080p Full HD (1920x1080) para presentaciones"
              />
            )}

            {/* Print / System PDF */}
            <button
              onClick={handlePrint}
              disabled={dayRecords.length === 0}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Imprimir o guardar como PDF en navegador"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Selector Sub-bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Día a reportar:
            </span>

            {/* Navigation arrows */}
            <button
              onClick={handlePrevDay}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded cursor-pointer transition-colors"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Native Date Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-800 text-xs focus:outline-blue-500 shadow-2xs"
            />

            <button
              onClick={handleNextDay}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded cursor-pointer transition-colors"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Quick dropdown of recorded days */}
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-blue-500 shadow-2xs max-w-[210px]"
            >
              <option value={selectedDate}>
                {selectedDate} ({dayRecords.length} eventos)
              </option>
              {datesWithRecords
                .filter((d) => d.date !== selectedDate)
                .map((d) => (
                  <option key={d.date} value={d.date}>
                    {d.date} ({d.count} paros · {formatHoursDecimal(d.minutes)})
                  </option>
                ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500">
            {dayRecords.length > 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {dayRecords.length} eventos listos para exportar
              </span>
            ) : (
              <span className="text-amber-700 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Sin paros registrados en esta fecha
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Printable Report Preview */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800 print:p-0 print:overflow-visible">
          {dayRecords.length === 0 ? (
            <div className="py-12 px-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                No hay tiempo muerto registrado el {selectedDate}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No se encontraron eventos de paro para la fecha seleccionada. Puedes elegir otro día con paros registrados arriba:
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {datesWithRecords.slice(0, 5).map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                  >
                    {d.date} ({d.count} paros)
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div ref={previewContainerRef} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-xs space-y-6 print:border-none print:p-0 print:shadow-none">
              {/* Document Letterhead */}
              <div className="border-b-2 border-blue-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-700">
                    SISTEMA DE CONTROL INDUSTRIAL DOWNTIMEPOR
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                    REPORTE DIARIO DE TIEMPO MUERTO Y ANÁLISIS DE FALLAS
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Metodología Pareto 80/20 · Análisis de Causa Raíz y Planes de Acción Correctivos
                  </p>
                </div>

                <div className="text-left sm:text-right font-mono text-xs text-slate-600 bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-lg border border-slate-100 sm:border-none">
                  <div>
                    Fecha Auditada:{' '}
                    <span className="font-bold text-slate-900">
                      {selectedDate}
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-700 font-semibold">
                    {formatDateLabel(selectedDate)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Emisión: {new Date().toLocaleDateString('es-MX')}
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-[10px] font-sans font-medium text-slate-500 block">
                    Tiempo Muerto Total:
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                    {timeUnit === 'minutes'
                      ? `${Math.round(totalMinutes).toLocaleString('es-MX')} min`
                      : formatHoursDecimal(totalMinutes)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {timeUnit === 'minutes'
                      ? formatHoursDecimal(totalMinutes)
                      : `${Math.round(totalMinutes).toLocaleString('es-MX')} min`}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-sans font-medium text-slate-500 block">
                    Total Incidentes:
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                    {totalEvents}{' '}
                    <span className="text-xs font-normal text-slate-500">paros</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">
                    En turnos auditados
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-sans font-medium text-slate-500 block">
                    Líneas Afectadas:
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-blue-700 mt-0.5">
                    {affectedLinesCount}
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">
                    Líneas de planta
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-sans font-medium text-slate-500 block">
                    MTTR Promedio:
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-amber-700 mt-0.5">
                    {Math.round(mttrMinutes)}{' '}
                    <span className="text-xs font-normal text-slate-500">min</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">
                    Por cada incidente
                  </span>
                </div>
              </div>

              {/* SECTION 1: PARETO POR LÍNEA */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Factory className="w-4 h-4 text-blue-600" />
                    1. Diagrama y Distribución Pareto de Tiempo por Línea (Ley 80/20)
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">
                    {lineAnalysis.items.length} líneas afectadas
                  </span>
                </div>

                {/* Pareto Visual Bar Representation */}
                <div className="space-y-2 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
                  {lineAnalysis.items.map((line, idx) => (
                    <div key={line.key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-mono font-bold">
                            {idx + 1}
                          </span>
                          {line.label}
                          {line.isVitalFew && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                              Línea Vital 80%
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatDuration(line.value, timeUnit)} ({line.percentage.toFixed(1)}% · Acum: {line.cumulativePercentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            line.isVitalFew ? 'bg-blue-600' : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.min(100, line.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed Pareto Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Línea de Producción</th>
                        <th className="py-2.5 px-3 text-right">Tiempo Muerto</th>
                        <th className="py-2.5 px-3 text-center">Eventos</th>
                        <th className="py-2.5 px-3 text-right">% Indiv.</th>
                        <th className="py-2.5 px-3 text-right">% Acum.</th>
                        <th className="py-2.5 px-3 text-center">Clasificación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {lineAnalysis.items.map((item, idx) => (
                        <tr
                          key={item.key}
                          className={item.isVitalFew ? 'bg-blue-50/30' : ''}
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-semibold">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-sans font-bold text-slate-900">
                            {item.label}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatDuration(item.value, timeUnit)}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-700">
                            {item.count}
                          </td>
                          <td className="py-2 px-3 text-right text-blue-700 font-bold">
                            {item.percentage.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right text-indigo-700 font-bold">
                            {item.cumulativePercentage.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.isVitalFew
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.isVitalFew ? '⚡ Vital 80%' : 'Secundaria'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: TABLA DE RESUMEN DETALLADA (LINEA, PROBLEMA, CAUSA RAIZ, ACCION CORRECTIVA) */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      2. Tabla de Resumen: Tiempo por Línea, Problema, Causa Raíz y Acción Correctiva
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Registro de campo con plan de mitigación ejecutado por el equipo técnico.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                    {dayRecords.length} eventos
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 w-40">Línea de Producción</th>
                        <th className="py-2.5 px-3 w-44">Problema & Equipo</th>
                        <th className="py-2.5 px-3">Causa Raíz Identificada</th>
                        <th className="py-2.5 px-3">Acción Correctiva Ejecutada</th>
                        <th className="py-2.5 px-3 w-28 text-right">Tiempo</th>
                        <th className="py-2.5 px-3 w-24 text-center">Turno</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {dayRecords.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-semibold">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {r.productionLine}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{r.problem}</div>
                            <div className="text-[11px] text-blue-700 font-medium">{r.machine}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 bg-slate-50/50 leading-snug">
                            {r.rootCauseNotes ? (
                              <span>{r.rootCauseNotes}</span>
                            ) : (
                              <span className="italic text-slate-400">No especificada</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-teal-800 font-medium bg-teal-50/20 leading-snug">
                            {r.actionTaken ? (
                              <span>{r.actionTaken}</span>
                            ) : (
                              <span className="italic text-slate-400">No documentada</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatDuration(r.durationMinutes, timeUnit)}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
                            {r.shift.startsWith('Turno') ? r.shift : `Turno ${r.shift}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures & Quality Sign-Off */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 print:pt-10">
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-1.5" />
                  <span className="font-bold text-slate-800 block">Supervisor de Turno / Operaciones</span>
                  <span className="text-[10px] text-slate-400">Firma y Sello de Validación</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-1.5" />
                  <span className="font-bold text-slate-800 block">Ingeniería de Mantenimiento / Planta</span>
                  <span className="text-[10px] text-slate-400">Aprobación de Acciones Correctivas</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/90 gap-3 print:hidden">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Genera un documento PDF descargable listo para auditorías y juntas diarias de planta.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || dayRecords.length === 0}
              className={`px-4 py-2 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs ${
                dayRecords.length === 0
                  ? 'bg-slate-300 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar Reporte .pdf'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
