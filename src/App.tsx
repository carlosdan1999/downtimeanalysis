import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DowntimeRecord,
  FilterState,
  ParetoMetric,
  MasterCatalogs,
  TimeUnit,
  TimeGranularity,
} from './types/downtime';
import {
  INITIAL_DOWNTIME_DATA,
  INITIAL_PRODUCTION_LINES,
  INITIAL_MACHINES,
  INITIAL_CATEGORIES,
  INITIAL_SHIFTS,
  INITIAL_PROBLEMS,
} from './data/initialData';
import {
  calculatePareto,
  filterRecords,
} from './utils/pareto';
import {
  formatHoursDecimal,
  formatDuration,
  formatDateLabel,
  formatMonthLabel,
} from './utils/dateUtils';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { ParetoChart } from './components/ParetoChart';
import { ParetoTable } from './components/ParetoTable';
import { DataTable } from './components/DataTable';
import { NewEntryModal } from './components/NewEntryModal';
import { EditRecordModal } from './components/EditRecordModal';
import { CatalogManagerModal } from './components/CatalogManagerModal';
import { SimulatorView } from './components/SimulatorView';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { DailyReportPdfModal } from './components/DailyReportPdfModal';
import { ImportExportModal } from './components/ImportExportModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SettingsModal } from './components/SettingsModal';
import { WeeklyTrendChart } from './components/WeeklyTrendChart';
import { WeeklyShiftTrendChart } from './components/WeeklyShiftTrendChart';
import { ExportPngButton } from './components/ExportPngButton';
import { normalizeShift } from './utils/excelImport';
import {
  Factory,
  Cpu,
  Clock,
  Settings2,
  BarChart3,
  TableProperties,
  Smartphone,
  Plus,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Eye,
  Calendar,
  Settings,
  TrendingUp,
  Layers,
} from 'lucide-react';

const LOCAL_STORAGE_RECORDS_KEY = 'downtime_pareto_records_v3';
const LOCAL_STORAGE_CATALOGS_KEY = 'downtime_pareto_catalogs_v3';
const LOCAL_STORAGE_SETTINGS_KEY = 'downtime_pareto_settings_v1';

function DrillDownRecordsPanel({
  title,
  records,
  timeUnit = 'hours',
  onEdit,
  onDelete,
  onClose,
}: {
  title: string;
  records: DowntimeRecord[];
  timeUnit?: TimeUnit;
  onEdit: (rec: DowntimeRecord) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  if (records.length === 0) return null;
  const totalMinutes = records.reduce((acc, r) => acc + r.durationMinutes, 0);

  return (
    <div ref={panelRef} className="bg-white border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <h4 className="text-sm font-bold text-slate-900">
            Eventos Registrados de: <span className="text-blue-700 font-semibold">{title}</span>
          </h4>
          <span className="text-xs bg-blue-50 text-blue-700 font-mono font-semibold px-2 py-0.5 rounded">
            {records.length} {records.length === 1 ? 'evento' : 'eventos'} ({formatDuration(totalMinutes, timeUnit)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ExportPngButton
            targetRef={panelRef}
            export1080Config={{
              title: `Detalle de Eventos Registrados: ${title}`,
              subtitle: `${records.length} eventos auditados · Impacto: ${formatDuration(totalMinutes, timeUnit)}`,
              legendItems: [
                { label: 'Eventos de Paro Auditados', color: '#2563eb', type: 'circle' },
              ],
              kpis: [
                { label: 'Tiempo Afectado', value: formatDuration(totalMinutes, timeUnit) },
                { label: 'Eventos', value: `${records.length}` },
              ],
              element: panelRef.current,
            }}
            filename={`detalle_eventos_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_1080p_full_hd.png`}
            label="Descargar PNG (1080p Full HD)"
            variant="secondary"
          />
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded hover:bg-slate-100 cursor-pointer transition-colors"
          >
            Cerrar detalle ✕
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {records.map((r) => (
          <div
            key={r.id}
            className="p-3 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-slate-900">{r.id}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{r.date} (Semana {r.weekOfYear})</span>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-blue-700">{r.machine}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{r.productionLine}</span>
              </div>
              <div className="text-slate-800 font-medium">
                {r.problem}{' '}
                <span className="text-slate-400 font-normal">({r.category} - {r.shift})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                {formatDuration(r.durationMinutes, timeUnit)}
              </span>
              <button
                onClick={() => onEdit(r)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Editar este registro"
              >
                <Edit2 className="w-3 h-3 text-amber-600" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar el registro ${r.id}?`)) {
                    onDelete(r.id);
                  }
                }}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Eliminar este registro"
              >
                <Trash2 className="w-3 h-3 text-rose-600" />
                <span>Borrar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  // Master Catalogs state (Lines, Machines, Problems, Categories, Shifts)
  const [catalogs, setCatalogs] = useState<MasterCatalogs>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CATALOGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.lines &&
          parsed.machines &&
          parsed.problems &&
          parsed.categories &&
          parsed.shifts
        ) {
          // Normalize shifts so any legacy 'Turno 1 (Matutino)' becomes '1', '2', '3'
          const normalizedShifts = Array.from(
            new Set(parsed.shifts.map((s: string) => normalizeShift(s)))
          ) as string[];
          return {
            ...parsed,
            shifts: normalizedShifts.length > 0 ? normalizedShifts : INITIAL_SHIFTS,
          };
        }
      }
    } catch (e) {
      console.error('Error loading saved catalogs', e);
    }
    return {
      lines: INITIAL_PRODUCTION_LINES,
      machines: INITIAL_MACHINES,
      problems: INITIAL_PROBLEMS,
      categories: INITIAL_CATEGORIES,
      shifts: INITIAL_SHIFTS,
    };
  });

  // Save catalogs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CATALOGS_KEY, JSON.stringify(catalogs));
    } catch (e) {
      console.error('Error saving catalogs', e);
    }
  }, [catalogs]);

  // Downtime records state
  const [records, setRecords] = useState<DowntimeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_RECORDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: DowntimeRecord) => ({
            ...r,
            shift: normalizeShift(r.shift),
          }));
        }
      }
    } catch (e) {
      console.error('Error loading saved records', e);
    }
    return INITIAL_DOWNTIME_DATA;
  });

  // Save records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records', e);
    }
  }, [records]);

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Metric selector: duration in minutes/hours or frequency of events
  const [metric, setMetric] = useState<ParetoMetric>('duration');

  // User settings: time unit ('minutes' | 'hours') and time granularity ('day' | 'week' | 'month')
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timeUnit === 'minutes' || parsed.timeUnit === 'hours') {
          return parsed.timeUnit;
        }
      }
    } catch {}
    return 'hours';
  });

  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.timeGranularity === 'day' ||
          parsed.timeGranularity === 'week' ||
          parsed.timeGranularity === 'month'
        ) {
          return parsed.timeGranularity;
        }
      }
    } catch {}
    return 'week';
  });

  // Save settings on change
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_SETTINGS_KEY,
        JSON.stringify({ timeUnit, timeGranularity })
      );
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }, [timeUnit, timeGranularity]);

  // Week ranges
  const { minWeek, maxWeek } = useMemo(() => {
    if (records.length === 0) return { minWeek: 1, maxWeek: 52 };
    const weeks = records.map((r) => r.weekOfYear);
    return {
      minWeek: Math.min(...weeks),
      maxWeek: Math.max(...weeks),
    };
  }, [records]);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    line: 'all',
    machine: 'all',
    category: 'all',
    shift: 'all',
    startWeek: minWeek,
    endWeek: maxWeek,
  });

  // Keep filter weeks aligned
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      startWeek: Math.max(1, Math.min(prev.startWeek, minWeek)),
      endWeek: Math.min(52, Math.max(prev.endWeek, maxWeek)),
    }));
  }, [minWeek, maxWeek]);

  // Selected bar/row for drill-down focus
  const [selectedDrillDownKey, setSelectedDrillDownKey] = useState<string | null>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDailyPdfModalOpen, setIsDailyPdfModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DowntimeRecord | null>(null);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return filterRecords(records, filters);
  }, [records, filters]);

  // Pareto analyses
  const problemAnalysis = useMemo(
    () => calculatePareto(filteredRecords, 'problem', metric),
    [filteredRecords, metric]
  );

  const machineAnalysis = useMemo(
    () => calculatePareto(filteredRecords, 'machine', metric),
    [filteredRecords, metric]
  );

  const lineAnalysis = useMemo(
    () => calculatePareto(filteredRecords, 'line', metric),
    [filteredRecords, metric]
  );

  const dayAnalysis = useMemo(
    () => calculatePareto(filteredRecords, 'day', metric),
    [filteredRecords, metric]
  );

  const weekAnalysis = useMemo(
    () => calculatePareto(filteredRecords, 'week', metric),
    [filteredRecords, metric]
  );

  const monthAnalysis = useMemo(
    () => calculatePareto(filteredRecords, 'month', metric),
    [filteredRecords, metric]
  );

  // Active temporal analysis based on selected granularity (day, week, month)
  const temporalAnalysis = useMemo(() => {
    if (timeGranularity === 'day') return dayAnalysis;
    if (timeGranularity === 'month') return monthAnalysis;
    return weekAnalysis;
  }, [timeGranularity, dayAnalysis, weekAnalysis, monthAnalysis]);

  // Matching records for the currently selected drill-down key
  const drillDownMatchingRecords = useMemo(() => {
    if (!selectedDrillDownKey) return [];
    if (activeTab === 'machine') {
      return filteredRecords.filter((r) => r.machine === selectedDrillDownKey);
    }
    if (activeTab === 'problem' || activeTab === 'overview') {
      return filteredRecords.filter((r) => r.problem === selectedDrillDownKey);
    }
    if (activeTab === 'line') {
      return filteredRecords.filter((r) => r.productionLine === selectedDrillDownKey);
    }
    if (activeTab === 'week') {
      if (timeGranularity === 'day') {
        return filteredRecords.filter((r) => r.date === selectedDrillDownKey);
      }
      if (timeGranularity === 'month') {
        return filteredRecords.filter(
          (r) => r.date && r.date.startsWith(selectedDrillDownKey)
        );
      }
      const match = selectedDrillDownKey.match(/\d+/);
      const wNum = match ? parseInt(match[0], 10) : null;
      return filteredRecords.filter((r) => r.weekOfYear === wNum);
    }
    return [];
  }, [selectedDrillDownKey, activeTab, filteredRecords, timeGranularity]);

  // Record CRUD handlers
  const handleAddRecord = (rawRec: DowntimeRecord) => {
    const newRec = { ...rawRec, shift: normalizeShift(rawRec.shift) };
    setRecords((prev) => [newRec, ...prev]);

    // Ensure line, machine, category, shift are present in catalogs
    setCatalogs((prev) => {
      const nextLines = prev.lines.includes(newRec.productionLine)
        ? prev.lines
        : [...prev.lines, newRec.productionLine];
      const nextMachines = prev.machines.includes(newRec.machine)
        ? prev.machines
        : [...prev.machines, newRec.machine];
      const nextCats = prev.categories.includes(newRec.category)
        ? prev.categories
        : [...prev.categories, newRec.category];
      const nextShifts = prev.shifts.includes(newRec.shift)
        ? prev.shifts
        : [...prev.shifts, newRec.shift];
      const hasProblem = prev.problems.some((p) => p.name === newRec.problem);
      const nextProbs = hasProblem
        ? prev.problems
        : [...prev.problems, { name: newRec.problem, category: newRec.category }];

      return {
        lines: nextLines,
        machines: nextMachines,
        categories: nextCats,
        shifts: nextShifts,
        problems: nextProbs,
      };
    });
  };

  const handleUpdateRecord = (updatedRec: DowntimeRecord) => {
    const norm = { ...updatedRec, shift: normalizeShift(updatedRec.shift) };
    setRecords((prev) =>
      prev.map((r) => (r.id === norm.id ? norm : r))
    );
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Master Catalogs update handler with ripple renaming
  const handleUpdateCatalogs = (
    newCatalogs: MasterCatalogs,
    renamedLine?: { oldName: string; newName: string },
    renamedMachine?: { oldName: string; newName: string },
    renamedProblem?: { oldName: string; newName: string; category: string }
  ) => {
    setCatalogs(newCatalogs);

    // If a line was renamed, cascade to existing records
    if (renamedLine) {
      setRecords((prev) =>
        prev.map((r) =>
          r.productionLine === renamedLine.oldName
            ? { ...r, productionLine: renamedLine.newName }
            : r
        )
      );
    }

    // If a machine was renamed, cascade to existing records
    if (renamedMachine) {
      setRecords((prev) =>
        prev.map((r) =>
          r.machine === renamedMachine.oldName
            ? { ...r, machine: renamedMachine.newName }
            : r
        )
      );
    }

    // If a problem was renamed or its category changed, cascade to existing records
    if (renamedProblem) {
      setRecords((prev) =>
        prev.map((r) =>
          r.problem === renamedProblem.oldName
            ? {
                ...r,
                problem: renamedProblem.newName,
                category: renamedProblem.category,
              }
            : r
        )
      );
    }
  };

  // Excel / CSV Import handler
  const handleImportRecords = (
    newRecords: DowntimeRecord[],
    mode: 'append' | 'replace',
    newCatalogs?: MasterCatalogs
  ) => {
    if (mode === 'replace') {
      setRecords(newRecords);
    } else {
      setRecords((prev) => [...newRecords, ...prev]);
    }

    if (newCatalogs) {
      setCatalogs(newCatalogs);
    }
  };

  const handleResetDemoData = () => {
    setRecords(INITIAL_DOWNTIME_DATA);
    setCatalogs({
      lines: INITIAL_PRODUCTION_LINES,
      machines: INITIAL_MACHINES,
      problems: INITIAL_PROBLEMS,
      categories: INITIAL_CATEGORIES,
      shifts: INITIAL_SHIFTS,
    });
  };

  // Specific selected temporal item inspection state (Day date, Week number or Month string)
  const [inspectedTemporalKey, setInspectedTemporalKey] = useState<string | null>(null);

  // Sub-view mode for temporal tab: 'all' (all charts), 'trend-total' (only total trendline), 'trend-shifts' (only shifts trendline), 'pareto' (only Pareto)
  const [temporalViewMode, setTemporalViewMode] = useState<
    'all' | 'trend-total' | 'trend-shifts' | 'pareto'
  >('all');

  const selectedWeekNum = useMemo(() => {
    if (!inspectedTemporalKey) return null;
    const match = inspectedTemporalKey.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }, [inspectedTemporalKey]);

  // Available options for temporal inspection
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    filteredRecords.forEach((r) => {
      if (r.date) set.add(r.date);
    });
    return Array.from(set).sort().reverse();
  }, [filteredRecords]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    filteredRecords.forEach((r) => {
      if (r.date) set.add(r.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [filteredRecords]);

  const inspectedTemporalRecords = useMemo(() => {
    if (!inspectedTemporalKey) return [];
    if (timeGranularity === 'day') {
      return filteredRecords.filter((r) => r.date === inspectedTemporalKey);
    }
    if (timeGranularity === 'month') {
      return filteredRecords.filter(
        (r) => r.date && r.date.startsWith(inspectedTemporalKey)
      );
    }
    const match = inspectedTemporalKey.match(/\d+/);
    const wNum = match ? parseInt(match[0], 10) : null;
    return filteredRecords.filter((r) => r.weekOfYear === wNum);
  }, [filteredRecords, inspectedTemporalKey, timeGranularity]);

  const inspectedTemporalPareto = useMemo(() => {
    return calculatePareto(inspectedTemporalRecords, 'problem', metric);
  }, [inspectedTemporalRecords, metric]);

  // Current tab human label
  const getTabLabel = () => {
    switch (activeTab) {
      case 'overview':
        return 'Visión General & Pareto 80/20';
      case 'problem':
        return 'Pareto por Problema / Falla';
      case 'machine':
        return 'Pareto por Máquina / Equipo';
      case 'line':
        return 'Pareto por Línea de Producción';
      case 'week':
        return `Pareto Temporal (${timeGranularity === 'day' ? 'Por Día' : timeGranularity === 'week' ? 'Por Semana' : 'Por Mes'})`;
      case 'simulator':
        return 'Simulador Kaizen 80/20';
      case 'data-table':
        return 'Registro Histórico de Paros';
      default:
        return 'Análisis';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation (Desktop and Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedDrillDownKey(null);
        }}
        totalRecordsCount={records.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDailyPdfReport={() => setIsDailyPdfModalOpen(true)}
        onOpenCatalogManager={() => setIsCatalogModalOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/70 pb-16 lg:pb-0">
        {/* Top Bar Contract (3 zones) */}
        <TopNav
          currentTabName={getTabLabel()}
          metric={metric}
          timeUnit={timeUnit}
          onMetricChange={setMetric}
          onToggleTimeUnit={() => setTimeUnit(timeUnit === 'minutes' ? 'hours' : 'minutes')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenNewModal={() => setIsNewModalOpen(true)}
          onOpenImportExport={() => setIsImportExportOpen(true)}
          onOpenReport={() => setIsReportOpen(true)}
          onOpenDailyPdfReport={() => setIsDailyPdfModalOpen(true)}
          onOpenCatalogs={() => setIsCatalogModalOpen(true)}
          onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Scrollable Workspace with bottom padding for mobile bar */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 min-w-0 pb-28 lg:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Global Filter Bar */}
            <FilterBar
              filters={filters}
              onChange={setFilters}
              availableLines={catalogs.lines}
              availableMachines={catalogs.machines}
              availableCategories={catalogs.categories}
              availableShifts={catalogs.shifts}
              minWeek={minWeek}
              maxWeek={maxWeek}
              totalFilteredCount={filteredRecords.length}
              totalRawCount={records.length}
              onOpenImportExport={() => setIsImportExportOpen(true)}
            />

            {/* TAB 1: VISIÓN GENERAL (DASHBOARD 80/20) */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <KpiCards analysis={problemAnalysis} metricType="problem" timeUnit={timeUnit} />

                {/* Main Problem Pareto Chart */}
                <ParetoChart
                  items={problemAnalysis.items}
                  metric={metric}
                  timeUnit={timeUnit}
                  title="Diagrama de Pareto: Causas Principales de Tiempo Muerto (Regla 80/20)"
                  selectedKey={selectedDrillDownKey}
                  onSelectBar={(item) =>
                    setSelectedDrillDownKey(
                      selectedDrillDownKey === item.key ? null : item.key
                    )
                  }
                />

                {/* Sub-Paretos Grid: By Machine and By Line */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mini Pareto Máquinas */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-blue-600" />
                          Pareto por Máquina / Equipo
                        </h4>
                        <p className="text-xs text-slate-500">
                          {catalogs.machines.length} máquinas en catálogo
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('machine')}
                        className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        Ver detalle →
                      </button>
                    </div>

                    <div className="space-y-3 mt-4">
                      {machineAnalysis.items.slice(0, 5).map((m) => (
                        <div key={m.key} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-800 truncate max-w-[240px]">
                              {m.label}
                            </span>
                            <span className="font-mono text-slate-900 font-bold">
                              {formatDuration(m.value, timeUnit)} ({m.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                m.isVitalFew ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                              style={{ width: `${Math.min(100, m.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini Pareto Líneas */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <Factory className="w-4 h-4 text-blue-600" />
                          Pareto por Línea de Producción
                        </h4>
                        <p className="text-xs text-slate-500">
                          {catalogs.lines.length} líneas configuradas
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('line')}
                        className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        Ver detalle →
                      </button>
                    </div>

                    <div className="space-y-3 mt-4">
                      {lineAnalysis.items.map((line) => (
                        <div key={line.key} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-800 truncate max-w-[240px]">
                              {line.label}
                            </span>
                            <span className="font-mono text-slate-900 font-bold">
                              {formatDuration(line.value, timeUnit)} ({line.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                line.isVitalFew ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                              style={{ width: `${Math.min(100, line.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pareto Breakdown Table */}
                <ParetoTable
                  items={problemAnalysis.items}
                  metric={metric}
                  timeUnit={timeUnit}
                  totalValue={problemAnalysis.totalValue}
                  selectedKey={selectedDrillDownKey}
                  groupByLabel="Problema / Falla de Producción"
                  onSelectRow={(item) =>
                    setSelectedDrillDownKey(
                      selectedDrillDownKey === item.key ? null : item.key
                    )
                  }
                />

                {selectedDrillDownKey && drillDownMatchingRecords.length > 0 && (
                  <DrillDownRecordsPanel
                    title={selectedDrillDownKey}
                    records={drillDownMatchingRecords}
                    timeUnit={timeUnit}
                    onEdit={(rec) => setEditingRecord(rec)}
                    onDelete={handleDeleteRecord}
                    onClose={() => setSelectedDrillDownKey(null)}
                  />
                )}
              </div>
            )}

            {/* TAB 2: PARETO POR PROBLEMA */}
            {activeTab === 'problem' && (
              <div className="space-y-6">
                <KpiCards analysis={problemAnalysis} metricType="problem" timeUnit={timeUnit} />

                <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-600 font-medium">
                    Catálogo activo de fallas: <span className="font-bold text-slate-900">{catalogs.problems.length} problemas</span> registrados
                  </div>
                  <button
                    onClick={() => setIsCatalogModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Editar Catálogo de Fallas
                  </button>
                </div>

                <ParetoChart
                  items={problemAnalysis.items}
                  metric={metric}
                  timeUnit={timeUnit}
                  title="Análisis Pareto Específico por Falla / Causa Raíz"
                  selectedKey={selectedDrillDownKey}
                  onSelectBar={(item) =>
                    setSelectedDrillDownKey(
                      selectedDrillDownKey === item.key ? null : item.key
                    )
                  }
                />

                {/* Matriz Causa Raíz & Frecuencia */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {problemAnalysis.items.slice(0, 3).map((item, index) => (
                    <div
                      key={item.key}
                      className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-mono">
                          CAUSA VITAL #{index + 1}
                        </span>
                        <span className="font-mono font-bold text-slate-700">{item.percentage.toFixed(1)}% del paro</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">
                        {item.label}
                      </h4>
                      <div className="space-y-1.5 text-xs font-mono text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex justify-between">
                          <span>Tiempo total:</span>
                          <span className="font-bold text-slate-900">
                            {formatDuration(item.value, timeUnit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paradas registradas:</span>
                          <span className="font-bold text-slate-800">{item.count} paradas</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <ParetoTable
                  items={problemAnalysis.items}
                  metric={metric}
                  timeUnit={timeUnit}
                  totalValue={problemAnalysis.totalValue}
                  selectedKey={selectedDrillDownKey}
                  groupByLabel="Problema / Falla"
                  onSelectRow={(item) =>
                    setSelectedDrillDownKey(
                      selectedDrillDownKey === item.key ? null : item.key
                    )
                  }
                />

                {selectedDrillDownKey && drillDownMatchingRecords.length > 0 && (
                  <DrillDownRecordsPanel
                    title={selectedDrillDownKey}
                    records={drillDownMatchingRecords}
                    timeUnit={timeUnit}
                    onEdit={(rec) => setEditingRecord(rec)}
                    onDelete={handleDeleteRecord}
                    onClose={() => setSelectedDrillDownKey(null)}
                  />
                )}
              </div>
            )}

            {/* TAB 3: PARETO POR MÁQUINA */}
            {activeTab === 'machine' && (
              <div className="space-y-6">
                <KpiCards analysis={machineAnalysis} metricType="machine" timeUnit={timeUnit} />

                <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-600 font-medium">
                    Máquinas registradas en planta: <span className="font-bold text-slate-900">{catalogs.machines.length} equipos</span> activos
                  </div>
                  <button
                    onClick={() => setIsCatalogModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Editar / Agregar Máquinas
                  </button>
                </div>

                <ParetoChart
                  items={machineAnalysis.items}
                  metric={metric}
                  timeUnit={timeUnit}
                  title="Diagrama de Pareto por Máquina / Equipo (Equipos Críticos)"
                  selectedKey={selectedDrillDownKey}
                  onSelectBar={(item) =>
                    setSelectedDrillDownKey(
                      selectedDrillDownKey === item.key ? null : item.key
                    )
                  }
                />

                {/* Drill down into specific machine */}
                {selectedDrillDownKey && (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-blue-200 mb-4">
                      <h4 className="text-sm font-bold text-blue-900">
                        Fallas Específicas en la Máquina: {selectedDrillDownKey}
                      </h4>
                      <button
                        onClick={() => setSelectedDrillDownKey(null)}
                        className="text-xs text-blue-600 hover:underline cursor-pointer font-semibold"
                      >
                        Quitar selección ✕
                      </button>
                    </div>

                    <ParetoTable
                      items={
                        calculatePareto(
                          filteredRecords.filter(
                            (r) => r.machine === selectedDrillDownKey
                          ),
                          'problem',
                          metric
                        ).items
                      }
                      metric={metric}
                      timeUnit={timeUnit}
                      totalValue={
                        calculatePareto(
                          filteredRecords.filter(
                            (r) => r.machine === selectedDrillDownKey
                          ),
                          'problem',
                          metric
                        ).totalValue
                      }
                      groupByLabel={`Problemas de ${selectedDrillDownKey}`}
                    />
                  </div>
                )}

                <ParetoTable
                  items={machineAnalysis.items}
                  metric={metric}
                  timeUnit={timeUnit}
                  totalValue={machineAnalysis.totalValue}
                  selectedKey={selectedDrillDownKey}
                  groupByLabel="Máquina / Equipo"
                  onSelectRow={(item) =>
                    setSelectedDrillDownKey(
                      selectedDrillDownKey === item.key ? null : item.key
                    )
                  }
                />

                {selectedDrillDownKey && drillDownMatchingRecords.length > 0 && (
                  <DrillDownRecordsPanel
                    title={`Máquina ${selectedDrillDownKey}`}
                    records={drillDownMatchingRecords}
                    timeUnit={timeUnit}
                    onEdit={(rec) => setEditingRecord(rec)}
                    onDelete={handleDeleteRecord}
                    onClose={() => setSelectedDrillDownKey(null)}
                  />
                )}
              </div>
            )}

            {/* TAB 4: PARETO POR LÍNEA DE PRODUCCIÓN */}
            {activeTab === 'line' && (
              <div className="space-y-6">
                <KpiCards analysis={lineAnalysis} metricType="line" timeUnit={timeUnit} />

                <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-600 font-medium">
                    Líneas en operación: <span className="font-bold text-slate-900">{catalogs.lines.length} líneas</span> activas
                  </div>
                  <button
                    onClick={() => setIsCatalogModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Editar / Agregar Líneas
                  </button>
                </div>

                <ParetoChart
                  items={lineAnalysis.items}
                  metric={metric}
                  timeUnit={timeUnit}
                  title="Diagrama de Pareto por Línea de Producción"
                  selectedKey={selectedDrillDownKey}
                  onSelectBar={(item) =>
                    setSelectedDrillDownKey(
                      selectedDrillDownKey === item.key ? null : item.key
                    )
                  }
                />

                {/* Drill Down into specific selected line */}
                {selectedDrillDownKey && (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-blue-200 mb-4">
                      <h4 className="text-sm font-bold text-blue-900">
                        Desglose de Fallas Específicas en: {selectedDrillDownKey}
                      </h4>
                      <button
                        onClick={() => setSelectedDrillDownKey(null)}
                        className="text-xs text-blue-600 hover:underline cursor-pointer font-semibold"
                      >
                        Quitar selección ✕
                      </button>
                    </div>

                    <ParetoTable
                      items={
                        calculatePareto(
                          filteredRecords.filter(
                            (r) => r.productionLine === selectedDrillDownKey
                          ),
                          'problem',
                          metric
                        ).items
                      }
                      metric={metric}
                      timeUnit={timeUnit}
                      totalValue={
                        calculatePareto(
                          filteredRecords.filter(
                            (r) => r.productionLine === selectedDrillDownKey
                          ),
                          'problem',
                          metric
                        ).totalValue
                      }
                      groupByLabel={`Problemas de ${selectedDrillDownKey}`}
                    />
                  </div>
                )}

                <ParetoTable
                  items={lineAnalysis.items}
                  metric={metric}
                  timeUnit={timeUnit}
                  totalValue={lineAnalysis.totalValue}
                  selectedKey={selectedDrillDownKey}
                  groupByLabel="Línea de Producción"
                  onSelectRow={(item) =>
                    setSelectedDrillDownKey(
                      selectedDrillDownKey === item.key ? null : item.key
                    )
                  }
                />

                {selectedDrillDownKey && drillDownMatchingRecords.length > 0 && (
                  <DrillDownRecordsPanel
                    title={`Línea ${selectedDrillDownKey}`}
                    records={drillDownMatchingRecords}
                    timeUnit={timeUnit}
                    onEdit={(rec) => setEditingRecord(rec)}
                    onDelete={handleDeleteRecord}
                    onClose={() => setSelectedDrillDownKey(null)}
                  />
                )}
              </div>
            )}

            {/* TAB 5: PARETO TEMPORAL (POR DÍA, SEMANA O MES) */}
            {activeTab === 'week' && (
              <div className="space-y-6">
                {/* Granularity & Time Unit Control Banner */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Visualización Temporal: {timeGranularity === 'day' ? 'Por Día (Diario)' : timeGranularity === 'week' ? 'Por Semana (Semanal)' : 'Por Mes (Mensual)'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Identifica las fechas críticas con mayor impacto acumulado de paro bajo la regla 80/20.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Segmented Switcher for Day / Week / Month */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
                      <button
                        onClick={() => {
                          setTimeGranularity('day');
                          setSelectedDrillDownKey(null);
                          setInspectedTemporalKey(null);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                          timeGranularity === 'day'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📅 Por Día
                      </button>
                      <button
                        onClick={() => {
                          setTimeGranularity('week');
                          setSelectedDrillDownKey(null);
                          setInspectedTemporalKey(null);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                          timeGranularity === 'week'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📆 Por Semana
                      </button>
                      <button
                        onClick={() => {
                          setTimeGranularity('month');
                          setSelectedDrillDownKey(null);
                          setInspectedTemporalKey(null);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                          timeGranularity === 'month'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🗓️ Por Mes
                      </button>
                    </div>

                    {/* Unit indicator badge & fast switch to settings */}
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Configuración de Unidades y Gráficas"
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{timeUnit === 'minutes' ? 'Minutos' : 'Horas'}</span>
                      <Settings className="w-3 h-3 text-slate-400 ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* KPI Cards for the active temporal granularity */}
                <KpiCards
                  analysis={temporalAnalysis}
                  metricType={timeGranularity}
                  timeUnit={timeUnit}
                />

                {/* Sub-view switcher for Temporal Tab: All, Trendline Total, Trendline Shifts, Pareto */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/90 text-xs font-semibold">
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => setTemporalViewMode('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        temporalViewMode === 'all'
                          ? 'bg-white text-blue-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Vista Completa (Todas las Gráficas)</span>
                    </button>
                    <button
                      onClick={() => setTemporalViewMode('trend-total')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        temporalViewMode === 'trend-total'
                          ? 'bg-white text-blue-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tendencia Semanal Total</span>
                    </button>
                    <button
                      onClick={() => setTemporalViewMode('trend-shifts')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        temporalViewMode === 'trend-shifts'
                          ? 'bg-white text-indigo-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tendencia por Turno (3 Turnos)</span>
                    </button>
                    <button
                      onClick={() => setTemporalViewMode('pareto')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        temporalViewMode === 'pareto'
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Diagrama Pareto 80/20</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 hidden md:inline px-2">
                    Analítica temporal y comportamiento cronológico
                  </div>
                </div>

                {/* 1. Gráfico de Líneas con Tiempo Muerto Total por Semana */}
                {(temporalViewMode === 'all' || temporalViewMode === 'trend-total') && (
                  <WeeklyTrendChart
                    records={filteredRecords}
                    metric={metric}
                    timeUnit={timeUnit}
                    selectedWeek={selectedWeekNum}
                    onSelectWeek={(w) => {
                      setInspectedTemporalKey(String(w));
                      setSelectedDrillDownKey(`Semana ${w}`);
                      if (timeGranularity !== 'week') {
                        setTimeGranularity('week');
                      }
                    }}
                  />
                )}

                {/* 2. Gráfico Trendline Multi-Línea con los 3 Turnos (1, 2 y 3) */}
                {(temporalViewMode === 'all' || temporalViewMode === 'trend-shifts') && (
                  <WeeklyShiftTrendChart
                    records={filteredRecords}
                    metric={metric}
                    timeUnit={timeUnit}
                    selectedWeek={selectedWeekNum}
                    onSelectWeek={(w) => {
                      setInspectedTemporalKey(String(w));
                      setSelectedDrillDownKey(`Semana ${w}`);
                      if (timeGranularity !== 'week') {
                        setTimeGranularity('week');
                      }
                    }}
                  />
                )}

                {/* 3. Diagrama de Pareto Temporal 80/20 */}
                {(temporalViewMode === 'all' || temporalViewMode === 'pareto') && (
                  <ParetoChart
                    items={temporalAnalysis.items}
                    metric={metric}
                    timeUnit={timeUnit}
                    title={
                      timeGranularity === 'day'
                        ? 'Diagrama de Pareto por Día (Ranking de Fechas con Mayor Tiempo Muerto)'
                        : timeGranularity === 'week'
                        ? 'Diagrama de Pareto por Semana del Año (Ranking de Semanas Críticas)'
                        : 'Diagrama de Pareto por Mes Calendario (Ranking Mensual de Tiempo Muerto)'
                    }
                    selectedKey={selectedDrillDownKey}
                    onSelectBar={(item) => {
                      const matchWeek = item.key.match(/\d+/);
                      if (timeGranularity === 'week' && matchWeek) {
                        setInspectedTemporalKey(
                          inspectedTemporalKey === matchWeek[0] ? null : matchWeek[0]
                        );
                      } else {
                        setInspectedTemporalKey(
                          inspectedTemporalKey === item.key ? null : item.key
                        );
                      }
                      setSelectedDrillDownKey(
                        selectedDrillDownKey === item.key ? null : item.key
                      );
                    }}
                  />
                )}

                {/* Temporal Inspection Panel */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {timeGranularity === 'day'
                          ? 'Inspección por Fecha / Día Individual'
                          : timeGranularity === 'week'
                          ? 'Inspección Interna por Semana Individual'
                          : 'Inspección por Mes Calendario Individual'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Selecciona un periodo para ver el diagrama de Pareto de causas específicas
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 font-medium">Periodo analizado:</span>
                      <select
                        value={inspectedTemporalKey || ''}
                        onChange={(e) =>
                          setInspectedTemporalKey(e.target.value ? e.target.value : null)
                        }
                        className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-3 font-mono font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="">Seleccionar periodo...</option>
                        {timeGranularity === 'day' &&
                          availableDates.map((d) => (
                            <option key={d} value={d}>
                              {formatDateLabel(d)} ({d})
                            </option>
                          ))}
                        {timeGranularity === 'week' &&
                          Array.from(
                            { length: Math.max(1, maxWeek - minWeek + 1) },
                            (_, i) => minWeek + i
                          ).map((w) => (
                            <option key={w} value={String(w)}>
                              Semana {w} (W{w})
                            </option>
                          ))}
                        {timeGranularity === 'month' &&
                          availableMonths.map((m) => (
                            <option key={m} value={m}>
                              {formatMonthLabel(m)} ({m})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {inspectedTemporalKey ? (
                    <div className="mt-4">
                      <div className="mb-3 text-xs text-slate-600 font-medium">
                        Resultados para{' '}
                        <span className="font-bold text-blue-700">
                          {timeGranularity === 'day'
                            ? formatDateLabel(inspectedTemporalKey)
                            : timeGranularity === 'month'
                            ? formatMonthLabel(inspectedTemporalKey)
                            : `Semana ${inspectedTemporalKey}`}
                        </span>{' '}
                        ({inspectedTemporalRecords.length} eventos):
                      </div>
                      <ParetoChart
                        items={inspectedTemporalPareto.items}
                        metric={metric}
                        timeUnit={timeUnit}
                        title={`Pareto de Problemas en ${
                          timeGranularity === 'day'
                            ? formatDateLabel(inspectedTemporalKey)
                            : timeGranularity === 'month'
                            ? formatMonthLabel(inspectedTemporalKey)
                            : `Semana ${inspectedTemporalKey}`
                        }`}
                      />

                      <div className="mt-4">
                        <DrillDownRecordsPanel
                          title={
                            timeGranularity === 'day'
                              ? formatDateLabel(inspectedTemporalKey)
                              : timeGranularity === 'month'
                              ? formatMonthLabel(inspectedTemporalKey)
                              : `Semana ${inspectedTemporalKey}`
                          }
                          records={inspectedTemporalRecords}
                          timeUnit={timeUnit}
                          onEdit={(rec) => setEditingRecord(rec)}
                          onDelete={handleDeleteRecord}
                          onClose={() => setInspectedTemporalKey(null)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Selecciona un periodo arriba o haz click en cualquier barra del Pareto superior para auditar ese periodo.
                    </div>
                  )}
                </div>

                {/* Pareto Breakdown Table */}
                <ParetoTable
                  items={temporalAnalysis.items}
                  metric={metric}
                  timeUnit={timeUnit}
                  totalValue={temporalAnalysis.totalValue}
                  selectedKey={selectedDrillDownKey}
                  groupByLabel={
                    timeGranularity === 'day'
                      ? 'Fecha / Día'
                      : timeGranularity === 'week'
                      ? 'Semana del Año'
                      : 'Mes Calendario'
                  }
                  onSelectRow={(item) => {
                    const matchWeek = item.key.match(/\d+/);
                    if (timeGranularity === 'week' && matchWeek) {
                      setInspectedTemporalKey(matchWeek[0]);
                    } else {
                      setInspectedTemporalKey(item.key);
                    }
                    setSelectedDrillDownKey(
                      selectedDrillDownKey === item.key ? null : item.key
                    );
                  }}
                />
              </div>
            )}

            {/* TAB 6: SIMULADOR 80/20 (KAIZEN / TPM) */}
            {activeTab === 'simulator' && (
              <SimulatorView
                records={filteredRecords}
                analysis={problemAnalysis}
                timeUnit={timeUnit}
              />
            )}

            {/* TAB 7: REGISTRO HISTÓRICO DE DATOS BRUTOS */}
            {activeTab === 'data-table' && (
              <DataTable
                records={filteredRecords}
                timeUnit={timeUnit}
                onDeleteRecord={handleDeleteRecord}
                onEditRecord={(rec) => setEditingRecord(rec)}
                onOpenNewModal={() => setIsNewModalOpen(true)}
                onOpenImportExport={() => setIsImportExportOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Quick Thumb Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around z-40 shadow-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${
            activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('machine')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${
            activeTab === 'machine' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span>Máquinas</span>
        </button>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 w-11 h-11 rounded-full bg-blue-600 text-white shadow-lg font-bold cursor-pointer"
          title="Nuevo Paro"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setIsImportExportOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer shadow-2xs active:scale-95"
          title="Alimentar desde Excel o Exportar (.xlsx)"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Excel</span>
        </button>

        <button
          onClick={() => setActiveTab('data-table')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${
            activeTab === 'data-table' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <TableProperties className="w-5 h-5" />
          <span>Paros</span>
        </button>
      </nav>

      {/* Modal: Nuevo Paro */}
      <NewEntryModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleAddRecord}
        catalogs={catalogs}
      />

      {/* Modal: Editar Paro Individual */}
      <EditRecordModal
        isOpen={editingRecord !== null}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        onSave={handleUpdateRecord}
        onDelete={handleDeleteRecord}
        catalogs={catalogs}
      />

      {/* Modal: Gestor de Catálogos Maestros (Líneas, Máquinas, Fallas, Categorías, Turnos) */}
      <CatalogManagerModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        catalogs={catalogs}
        onUpdateCatalogs={handleUpdateCatalogs}
      />

      {/* Modal: Alimentación Excel / CSV */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        records={records}
        catalogs={catalogs}
        onImportRecords={handleImportRecords}
        onResetDemoData={handleResetDemoData}
      />

      {/* Modal: Informe Ejecutivo Imprimible */}
      <ExecutiveReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        records={filteredRecords}
        problemAnalysis={problemAnalysis}
        lineAnalysis={lineAnalysis}
        weekAnalysis={weekAnalysis}
        timeUnit={timeUnit}
        onOpenDailyPdfReport={() => setIsDailyPdfModalOpen(true)}
      />

      {/* Modal: Reporte Diario en .PDF (Tiempo muerto total, Pareto por línea, causa raíz y acciones correctivas) */}
      <DailyReportPdfModal
        isOpen={isDailyPdfModalOpen}
        onClose={() => setIsDailyPdfModalOpen(false)}
        records={records}
        timeUnit={timeUnit}
      />

      {/* Modal: Versión Android / Móvil QR */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Modal: Configuración del Sistema (Unidad de Tiempo y Gráficas) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        timeUnit={timeUnit}
        onTimeUnitChange={setTimeUnit}
        timeGranularity={timeGranularity}
        onTimeGranularityChange={setTimeGranularity}
        onOpenCatalogs={() => setIsCatalogModalOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenDailyPdfReport={() => setIsDailyPdfModalOpen(true)}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
