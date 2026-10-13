import React from 'react';
import { ParetoMetric, TimeUnit } from '../types/downtime';
import { PlusCircle, FileText, Settings2, FileSpreadsheet, Smartphone, Menu, Settings } from 'lucide-react';

interface TopNavProps {
  currentTabName: string;
  metric: ParetoMetric;
  timeUnit: TimeUnit;
  onMetricChange: (metric: ParetoMetric) => void;
  onToggleTimeUnit: () => void;
  onOpenSettings: () => void;
  onOpenNewModal: () => void;
  onOpenImportExport: () => void;
  onOpenReport: () => void;
  onOpenDailyPdfReport: () => void;
  onOpenCatalogs: () => void;
  onOpenAndroidModal: () => void;
  onToggleMobileMenu: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTabName,
  metric,
  timeUnit,
  onMetricChange,
  onToggleTimeUnit,
  onOpenSettings,
  onOpenNewModal,
  onOpenImportExport,
  onOpenReport,
  onOpenDailyPdfReport,
  onOpenCatalogs,
  onOpenAndroidModal,
  onToggleMobileMenu,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 select-none shadow-2xs gap-2">
      {/* Zone 1: Context Breadcrumb / Title with Mobile Menu Button */}
      <div className="flex items-center gap-2 text-xs min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="hidden md:inline font-semibold text-slate-500 shrink-0">
          Líneas de Producción
        </span>
        <span className="hidden md:inline text-slate-300 shrink-0">/</span>
        <span className="font-bold text-slate-900 text-sm truncate">
          {currentTabName}
        </span>
      </div>

      {/* Zone 2: Metric Segmented Control with Quick Unit Toggle */}
      <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/60 shrink-0">
        <button
          onClick={() => onMetricChange('duration')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
            metric === 'duration'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {timeUnit === 'minutes' ? 'Tiempo Muerto (Minutos)' : 'Tiempo Muerto (Horas)'}
        </button>
        <button
          onClick={() => onMetricChange('frequency')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
            metric === 'frequency'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Frecuencia de Paros
        </button>

        {metric === 'duration' && (
          <button
            onClick={onToggleTimeUnit}
            className="ml-1 px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 shadow-2xs border border-slate-200 cursor-pointer transition-colors"
            title={`Alternar unidad: actualmente en ${timeUnit === 'minutes' ? 'minutos' : 'horas'}`}
          >
            {timeUnit === 'minutes' ? '⚡ min' : '⏱️ h'}
          </button>
        )}
      </div>

      {/* Zone 3: Fast Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          title="Configuración de Unidades de Tiempo y Gráficas"
        >
          <Settings className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Settings</span>
        </button>

        {/* Excel Button: Always visible on mobile and desktop */}
        <button
          onClick={onOpenImportExport}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
          title="Alimentar desde Excel o Exportar (.xlsx)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Excel</span>
        </button>

        {/* Daily Report .PDF Generator Button */}
        <button
          onClick={onOpenDailyPdfReport}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300/80 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
          title="Generar reporte de un día elegido en .pdf (Tiempo muerto, Pareto por línea y acciones correctivas)"
        >
          <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="hidden sm:inline">Reporte Diario PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>

        {/* Android / Mobile Button: Desktop & Tablet header, on mobile available in drawer & bottom bar */}
        <button
          onClick={onOpenAndroidModal}
          className="hidden sm:flex px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-lg transition-colors cursor-pointer items-center gap-1.5 shadow-2xs"
          title="Instalar en Android / En tu Teléfono"
        >
          <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Versión Android</span>
        </button>

        <button
          onClick={onOpenCatalogs}
          className="hidden xl:flex px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer items-center gap-1.5"
          title="Editar Líneas, Máquinas, Fallas, Categorías y Turnos"
        >
          <Settings2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Catálogos</span>
        </button>

        <button
          onClick={onOpenReport}
          className="hidden lg:flex px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer items-center gap-1.5"
          title="Ver Informe Ejecutivo"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Informe</span>
        </button>

        <button
          onClick={onOpenNewModal}
          className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">+ Registrar Paro</span>
          <span className="sm:hidden">+ Paro</span>
        </button>
      </div>
    </header>
  );
};
