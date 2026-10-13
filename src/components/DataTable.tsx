import React, { useState, useRef } from 'react';
import { DowntimeRecord, TimeUnit } from '../types/downtime';
import { formatHoursDecimal, formatDuration } from '../utils/dateUtils';
import { Trash2, Eye, Edit2, Plus, FileSpreadsheet, Cpu, Factory, Clock } from 'lucide-react';
import { ExportPngButton } from './ExportPngButton';
import { exportTo1080pFullHdPng } from '../utils/exportToPng';

interface DataTableProps {
  records: DowntimeRecord[];
  timeUnit?: TimeUnit;
  onDeleteRecord: (id: string) => void;
  onEditRecord: (record: DowntimeRecord) => void;
  onOpenNewModal: () => void;
  onOpenImportExport?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  timeUnit = 'hours',
  onDeleteRecord,
  onEditRecord,
  onOpenNewModal,
  onOpenImportExport,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawTableRef = useRef<HTMLTableElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<DowntimeRecord | null>(null);

  const confirmAndDelete = (id: string, machine?: string) => {
    const label = machine ? ` de la máquina "${machine}"` : '';
    if (confirm(`¿Estás seguro de eliminar el registro de paro ${id}${label}? Esta acción no se puede deshacer.`)) {
      onDeleteRecord(id);
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    }
  };

  const totalMin = records.reduce((acc, r) => acc + r.durationMinutes, 0);
  const totalFormatted =
    timeUnit === 'minutes'
      ? `${Math.round(totalMin).toLocaleString('es-MX')} min`
      : formatHoursDecimal(totalMin);

  const handleExport1080 = async () => {
    await exportTo1080pFullHdPng({
      filename: `tabla_historico_paros_1080p_full_hd.png`,
      title: 'Bitácora Detallada de Paros y Tiempos Muertos',
      subtitle: `Auditoría y control de tiempos muertos en planta industrial · ${records.length} registros auditados · Total: ${totalFormatted}`,
      legendItems: [
        { label: `Total Eventos: ${records.length}`, color: '#2563eb', type: 'circle' },
        { label: `Tiempo Muerto Total: ${totalFormatted}`, color: '#d97706', type: 'circle' },
      ],
      kpis: [
        { label: 'Total Tiempo', value: totalFormatted },
        { label: 'Eventos', value: `${records.length}` },
      ],
      tableElement: rawTableRef.current,
      element: containerRef.current,
      footerNote: 'Sistema de Control de Tiempo Muerto · Auditoría de Paros para Presentación',
    });
  };

  return (
    <div ref={containerRef} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Header with Title and Legend strictly in the upper-left corner */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white">
        {/* Esquina superior izquierda */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Registro Histórico de Paros y Tiempos Muertos
          </h3>
          <p className="text-xs text-slate-500">
            Total de <span className="font-semibold text-slate-800">{records.length} eventos</span> auditados con máquina causante y causa raíz
          </p>

          {/* Leyenda en la esquina superior izquierda */}
          <div className="flex items-center gap-3 text-xs font-medium pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              <span className="text-slate-800 font-semibold">{records.length} paros registrados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-slate-800 font-semibold">{totalFormatted} acumulados</span>
            </div>
          </div>
        </div>

        {/* Acciones en la esquina superior derecha */}
        <div className="flex items-center gap-2 flex-wrap self-start">
          {onOpenImportExport && (
            <button
              onClick={onOpenImportExport}
              className="px-3 sm:px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Importar desde archivo Excel o exportar a .xlsx"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Importar / Exportar Excel</span>
            </button>
          )}

          <ExportPngButton
            targetRef={containerRef}
            onCustomExport={handleExport1080}
            filename={`tabla_historico_paros_1080p_full_hd.png`}
            label="Descargar Tabla PNG (1080p Full HD)"
            tooltip="Guardar tabla completa de datos históricos en alta resolución 1080p Full HD (1920x1080) para diapositivas de presentación"
          />

          <button
            onClick={onOpenNewModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Paro</span>
          </button>
        </div>
      </div>

      {/* MOBILE VIEW: Touch-friendly cards list with direct Edit and Delete buttons */}
      <div className="block md:hidden divide-y divide-slate-100">
        {records.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No hay registros de paros que coincidan con los filtros aplicados.
          </div>
        ) : (
          records.map((r) => (
            <div key={r.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-xs">{r.id}</span>
                  <span className="text-[11px] text-slate-500">{r.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-mono">
                    W{r.weekOfYear}
                  </span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">
                    {timeUnit === 'minutes'
                      ? `${r.durationMinutes} min`
                      : formatHoursDecimal(r.durationMinutes)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Máquina / Equipo:</span>
                  <span className="font-semibold text-blue-700 flex items-center gap-1 mt-0.5 truncate" title={r.machine}>
                    <Cpu className="w-3 h-3 shrink-0" />
                    {r.machine}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Línea:</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5 truncate" title={r.productionLine}>
                    <Factory className="w-3 h-3 shrink-0 text-slate-400" />
                    {r.productionLine}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Problema / Falla:</span>
                <div className="font-semibold text-slate-900 text-xs mt-0.5">
                  {r.problem}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {r.category}
                  </span>
                  <span>•</span>
                  <span>{r.shift.startsWith('Turno') ? r.shift : `Turno ${r.shift}`}</span>
                </div>
              </div>

              {/* Direct Touch Action Buttons for Mobile */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => setSelectedRecord(r)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Detalle</span>
                </button>
                <button
                  onClick={() => onEditRecord(r)}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => confirmAndDelete(r.id, r.machine)}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Borrar</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP / TABLET VIEW: High density data table */}
      <div className="hidden md:block overflow-x-auto">
        <table ref={rawTableRef} className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">ID / Fecha</th>
              <th className="py-3 px-4">Semana</th>
              <th className="py-3 px-4">Línea de Producción</th>
              <th className="py-3 px-4">Máquina / Equipo</th>
              <th className="py-3 px-4">Problema / Falla</th>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4 text-right">Duración ({timeUnit === 'minutes' ? 'min' : 'h'})</th>
              <th className="py-3 px-4">Turno</th>
              <th className="py-3 px-4 text-center" data-export-ignore="true">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {records.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-xs text-slate-500 font-sans">
                  No hay registros de paros que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              records.map((r) => {
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.id}</div>
                      <div className="text-[11px] text-slate-500 font-sans">{r.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        W{r.weekOfYear}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-800 font-medium">
                      {r.productionLine}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-900 font-semibold max-w-[190px] truncate" title={r.machine}>
                      {r.machine}
                    </td>
                    <td
                      className="py-3 px-4 font-sans font-semibold text-slate-900 max-w-[220px] truncate"
                      title={r.problem}
                    >
                      {r.problem}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {timeUnit === 'minutes' ? `${r.durationMinutes} min` : formatHoursDecimal(r.durationMinutes)}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({timeUnit === 'minutes' ? formatHoursDecimal(r.durationMinutes) : `${r.durationMinutes}m`})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono bg-slate-100 text-slate-800 border border-slate-200">
                        {r.shift.startsWith('Turno') ? r.shift : `Turno ${r.shift}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-sans" data-export-ignore="true">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver detalles de Causa Raíz"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditRecord(r)}
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar registro de tiempo muerto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmAndDelete(r.id, r.machine)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar este registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Detalle del Paro · <span className="font-mono text-blue-600">{selectedRecord.id}</span>
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{selectedRecord.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>Semana {selectedRecord.weekOfYear}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedRecord.shift.startsWith('Turno') ? selectedRecord.shift : `Turno ${selectedRecord.shift}`}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-slate-500 font-medium">Línea de Producción:</div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">
                    {selectedRecord.productionLine}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Máquina / Equipo:</div>
                  <div className="text-sm font-bold text-blue-700 mt-0.5">
                    {selectedRecord.machine}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-slate-500 font-medium">Problema Detectado:</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedRecord.problem}
                </div>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedRecord.category}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                <span className="text-slate-500 text-[11px]">Tiempo Muerto Perdido:</span>
                <div className="text-lg font-mono font-bold text-blue-900 mt-0.5">
                  {formatHoursDecimal(selectedRecord.durationMinutes)}{' '}
                  <span className="text-xs font-normal text-slate-600">
                    ({selectedRecord.durationMinutes} minutos acumulados)
                  </span>
                </div>
              </div>

              <div>
                <div className="text-slate-500 font-medium">Análisis de Causa Raíz (5 Porqués / Ishikawa):</div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-800 mt-1 leading-relaxed border border-slate-100">
                  {selectedRecord.rootCauseNotes || 'Sin notas registradas.'}
                </div>
              </div>

              <div>
                <div className="text-slate-500 font-medium">Acción Correctiva Ejecutada:</div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-800 mt-1 leading-relaxed border border-slate-100">
                  {selectedRecord.actionTaken || 'Sin acción correctiva especificada.'}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => confirmAndDelete(selectedRecord.id, selectedRecord.machine)}
                className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs transition-colors shadow-2xs"
                title="Eliminar este registro"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const rec = selectedRecord;
                    setSelectedRecord(null);
                    onEditRecord(rec);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Registro</span>
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
