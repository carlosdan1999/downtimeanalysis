import React from 'react';
import { FilterState } from '../types/downtime';
import { Search, RotateCcw, FileSpreadsheet } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  availableLines: string[];
  availableMachines: string[];
  availableCategories: string[];
  availableShifts: string[];
  minWeek: number;
  maxWeek: number;
  totalFilteredCount: number;
  totalRawCount: number;
  onOpenImportExport?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  availableLines,
  availableMachines,
  availableCategories,
  availableShifts,
  minWeek,
  maxWeek,
  totalFilteredCount,
  totalRawCount,
  onOpenImportExport,
}) => {
  const isFiltered =
    filters.search !== '' ||
    filters.line !== 'all' ||
    filters.machine !== 'all' ||
    filters.category !== 'all' ||
    filters.shift !== 'all' ||
    filters.startWeek !== minWeek ||
    filters.endWeek !== maxWeek;

  const resetFilters = () => {
    onChange({
      search: '',
      line: 'all',
      machine: 'all',
      category: 'all',
      shift: 'all',
      startWeek: minWeek,
      endWeek: maxWeek,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-5 text-xs shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por falla, causa, línea, máquina..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filter Línea */}
        <div className="flex items-center gap-1.5">
          <label className="text-slate-600 font-medium whitespace-nowrap">Línea:</label>
          <select
            value={filters.line}
            onChange={(e) => onChange({ ...filters, line: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas las Líneas ({availableLines.length})</option>
            {availableLines.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Máquina */}
        <div className="flex items-center gap-1.5">
          <label className="text-slate-600 font-medium whitespace-nowrap">Máquina:</label>
          <select
            value={filters.machine}
            onChange={(e) => onChange({ ...filters, machine: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 max-w-[200px] truncate"
          >
            <option value="all">Todas las Máquinas ({availableMachines.length})</option>
            {availableMachines.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Categoría */}
        <div className="flex items-center gap-1.5">
          <label className="text-slate-600 font-medium whitespace-nowrap">Categoría:</label>
          <select
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas ({availableCategories.length})</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Turno */}
        <div className="flex items-center gap-1.5">
          <label className="text-slate-600 font-medium whitespace-nowrap">Turno:</label>
          <select
            value={filters.shift}
            onChange={(e) => onChange({ ...filters, shift: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos los Turnos</option>
            {availableShifts.map((s) => (
              <option key={s} value={s}>
                {s.startsWith('Turno') ? s : `Turno ${s}`}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Rango Semanal */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
          <span className="text-slate-600 font-medium">Semana:</span>
          <select
            value={filters.startWeek}
            onChange={(e) =>
              onChange({
                ...filters,
                startWeek: Math.min(Number(e.target.value), filters.endWeek),
              })
            }
            className="bg-transparent text-slate-800 font-mono font-bold focus:outline-none cursor-pointer"
          >
            {Array.from({ length: Math.max(1, maxWeek - minWeek + 1) }, (_, i) => minWeek + i).map((w) => (
              <option key={`start-${w}`} value={w}>
                W{w}
              </option>
            ))}
          </select>
          <span className="text-slate-400">a</span>
          <select
            value={filters.endWeek}
            onChange={(e) =>
              onChange({
                ...filters,
                endWeek: Math.max(Number(e.target.value), filters.startWeek),
              })
            }
            className="bg-transparent text-slate-800 font-mono font-bold focus:outline-none cursor-pointer"
          >
            {Array.from({ length: Math.max(1, maxWeek - minWeek + 1) }, (_, i) => minWeek + i).map((w) => (
              <option key={`end-${w}`} value={w}>
                W{w}
              </option>
            ))}
          </select>
        </div>

        {/* Status / Reset & Excel Action */}
        <div className="flex items-center gap-2.5 ml-auto flex-wrap">
          {onOpenImportExport && (
            <button
              onClick={onOpenImportExport}
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
              title="Alimentar datos desde archivo Excel (.xlsx) o exportar reporte"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Importar / Exportar Excel</span>
            </button>
          )}

          <div className="text-slate-600 font-mono text-[11px] font-semibold whitespace-nowrap bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
            {totalFilteredCount} / {totalRawCount} registros
          </div>

          {isFiltered && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold whitespace-nowrap cursor-pointer transition-colors text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
