import React from 'react';
import { TimeUnit, TimeGranularity } from '../types/downtime';
import {
  Settings,
  Clock,
  Calendar,
  Check,
  X,
  FileSpreadsheet,
  Settings2,
  Smartphone,
  Sliders,
  FileText,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeUnit: TimeUnit;
  onTimeUnitChange: (unit: TimeUnit) => void;
  timeGranularity: TimeGranularity;
  onTimeGranularityChange: (granularity: TimeGranularity) => void;
  onOpenCatalogs?: () => void;
  onOpenImportExport?: () => void;
  onOpenAndroidModal?: () => void;
  onOpenDailyPdfReport?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  timeUnit,
  onTimeUnitChange,
  timeGranularity,
  onTimeGranularityChange,
  onOpenCatalogs,
  onOpenImportExport,
  onOpenAndroidModal,
  onOpenDailyPdfReport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Configuración del Sistema
              </h3>
              <p className="text-xs text-slate-500">
                Unidades de tiempo y visualización de gráficas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
          {/* SECTION 1: UNIDAD DE TIEMPO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Unidad de Medida del Tiempo Muerto
              </label>
              <span className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Activo: {timeUnit === 'minutes' ? 'Minutos (min)' : 'Horas (h)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Selecciona cómo deseas visualizar las duraciones en diagramas de Pareto, tablas, KPIs y reportes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option: Minutos */}
              <button
                type="button"
                onClick={() => onTimeUnitChange('minutes')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  timeUnit === 'minutes'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        timeUnit === 'minutes'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {timeUnit === 'minutes' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="font-bold text-slate-900 text-xs">
                      Minutos (min)
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    145 min
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Muestra el tiempo exacto en minutos. Ideal para paros cortos, TPM y control operativo directo de planta.
                </p>
              </button>

              {/* Option: Horas */}
              <button
                type="button"
                onClick={() => onTimeUnitChange('hours')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  timeUnit === 'hours'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        timeUnit === 'hours'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {timeUnit === 'hours' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="font-bold text-slate-900 text-xs">
                      Horas (h)
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                    2.4 h
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Muestra el tiempo en formato decimal de horas. Recomendado para juntas gerenciales, cálculo de OEE y Six Sigma.
                </p>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 2: VISUALIZACIÓN DE GRÁFICAS (DÍA, SEMANA, MES) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Visualización Temporal de Gráficas
              </label>
              <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded capitalize">
                Por {timeGranularity === 'day' ? 'Día' : timeGranularity === 'week' ? 'Semana' : 'Mes'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Define la periodicidad para agrupar y clasificar el tiempo muerto en el análisis temporal:
            </p>

            <div className="space-y-2 pt-1">
              {/* Option: Por Día */}
              <button
                type="button"
                onClick={() => onTimeGranularityChange('day')}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  timeGranularity === 'day'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      timeGranularity === 'day'
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {timeGranularity === 'day' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      📅 Por Día (Diario)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Agrupa por fecha específica. Identifica los días más críticos de la operación.
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-semibold shrink-0 hidden sm:inline">
                  YYYY-MM-DD
                </span>
              </button>

              {/* Option: Por Semana */}
              <button
                type="button"
                onClick={() => onTimeGranularityChange('week')}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  timeGranularity === 'week'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      timeGranularity === 'week'
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {timeGranularity === 'week' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      📆 Por Semana (Semanal)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Agrupa por semana del año (W1–W52). Estándar de la metodología Lean 80/20.
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-semibold shrink-0 hidden sm:inline">
                  Semana ISO
                </span>
              </button>

              {/* Option: Por Mes */}
              <button
                type="button"
                onClick={() => onTimeGranularityChange('month')}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  timeGranularity === 'month'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      timeGranularity === 'month'
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {timeGranularity === 'month' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      🗓️ Por Mes (Mensual)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Agrupa por mes calendario. Para seguimiento a mediano y largo plazo.
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-semibold shrink-0 hidden sm:inline">
                  Mes & Año
                </span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 3: ACCESOS RÁPIDOS */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-600" />
              Otros Módulos de Configuración
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {onOpenDailyPdfReport && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDailyPdfReport();
                  }}
                  className="p-2.5 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/80 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-rose-900 group-hover:text-rose-950 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    Reporte Diario en .PDF
                  </div>
                  <div className="text-[10px] text-rose-700/80 mt-0.5">
                    Descargar reporte con Pareto y causa raíz
                  </div>
                </button>
              )}

              {onOpenCatalogs && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCatalogs();
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 group-hover:text-blue-700 text-[11px]">
                    <Settings2 className="w-3.5 h-3.5 text-blue-600" />
                    Catálogos Maestros
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Líneas, fallas, turnos
                  </div>
                </button>
              )}

              {onOpenImportExport && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenImportExport();
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 group-hover:text-emerald-700 text-[11px]">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Excel (.xlsx)
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Importar / Exportar
                  </div>
                </button>
              )}

              {onOpenAndroidModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAndroidModal();
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 group-hover:text-indigo-700 text-[11px]">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                    App Android
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Instalar en móvil
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80 gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Preferencias guardadas automáticamente</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
          >
            Listo / Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
