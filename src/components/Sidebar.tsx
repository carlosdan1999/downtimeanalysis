import React from 'react';
import {
  BarChart3,
  AlertTriangle,
  Factory,
  Cpu,
  Calendar,
  TableProperties,
  Sparkles,
  Settings2,
  Smartphone,
  FileSpreadsheet,
  Settings,
  FileText,
  X,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'problem'
  | 'machine'
  | 'line'
  | 'week'
  | 'data-table'
  | 'simulator';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  totalRecordsCount: number;
  onOpenSettings?: () => void;
  onOpenDailyPdfReport?: () => void;
  onOpenCatalogManager: () => void;
  onOpenImportExport: () => void;
  onOpenAndroidModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  totalRecordsCount,
  onOpenSettings,
  onOpenDailyPdfReport,
  onOpenCatalogManager,
  onOpenImportExport,
  onOpenAndroidModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'overview' as ActiveTab,
      label: 'Visión General',
      subtitle: 'Dashboard Pareto 80/20',
      icon: BarChart3,
    },
    {
      id: 'problem' as ActiveTab,
      label: 'Pareto por Problema',
      subtitle: 'Fallas y causas raíz',
      icon: AlertTriangle,
    },
    {
      id: 'machine' as ActiveTab,
      label: 'Pareto por Máquina',
      subtitle: 'Equipos críticos de planta',
      icon: Cpu,
    },
    {
      id: 'line' as ActiveTab,
      label: 'Pareto por Línea',
      subtitle: 'Comparativa de planta',
      icon: Factory,
    },
    {
      id: 'week' as ActiveTab,
      label: 'Pareto Temporal',
      subtitle: 'Por día, semana o mes',
      icon: Calendar,
    },
    {
      id: 'simulator' as ActiveTab,
      label: 'Simulador 80/20',
      subtitle: 'Proyección Kaizen / TPM',
      icon: Sparkles,
    },
    {
      id: 'data-table' as ActiveTab,
      label: 'Registro de Paros',
      subtitle: `${totalRecordsCount} eventos registrados`,
      icon: TableProperties,
    },
  ];

  const content = (
    <div className="w-64 h-full bg-white text-slate-700 flex flex-col shrink-0 border-r border-slate-200 select-none shadow-xs">
      {/* Brand area */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs tracking-wider">
            DP
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
              DowntimePro
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Análisis Pareto Industrial
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation menu */}
      <div className="p-3 flex-1 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Módulos de Análisis
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <div className="truncate">
                <div className="leading-tight">{item.label}</div>
                <div
                  className={`text-[10px] truncate ${
                    isActive ? 'text-blue-100 font-normal' : 'text-slate-400'
                  }`}
                >
                  {item.subtitle}
                </div>
              </div>
            </button>
          );
        })}

        <div className="pt-3 border-t border-slate-100 mt-3 space-y-1">
          {onOpenDailyPdfReport && (
            <button
              onClick={() => {
                onOpenDailyPdfReport();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-rose-800 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/80 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="text-left">
                <div>Reporte Diario .PDF</div>
                <div className="text-[10px] text-rose-700 font-medium">Pareto por línea, causa raíz y plan</div>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              onOpenImportExport();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-left">
              <div>Importar / Exportar Excel</div>
              <div className="text-[10px] text-emerald-700 font-medium">Alimentar desde .xlsx o exportar</div>
            </div>
          </button>

          {onOpenSettings && (
            <button
              onClick={() => {
                onOpenSettings();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="text-left">
                <div>Configuración / Settings</div>
                <div className="text-[10px] text-slate-400 font-normal">Minutos/horas y gráficos</div>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              onOpenCatalogManager();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <Settings2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-left">
              <div>Catálogos & Máquinas</div>
              <div className="text-[10px] text-slate-400 font-normal">Editar líneas, fallas, turnos</div>
            </div>
          </button>

          <button
            onClick={() => {
              onOpenAndroidModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="text-left">
              <div>Versión Android</div>
              <div className="text-[10px] text-slate-500 font-normal">Instalar app en tu móvil</div>
            </div>
          </button>
        </div>
      </div>

      {/* Industrial info bottom tag */}
      <div className="p-3.5 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50/70">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-700">Metodología 80/20</span>
          <span className="text-blue-600 font-mono font-bold">Six Sigma / Lean</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-snug">
          Identifica las máquinas y causas críticas que concentran el paro en planta.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex shrink-0 h-full">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
