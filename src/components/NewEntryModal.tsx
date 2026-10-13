import React, { useState } from 'react';
import { DowntimeRecord, MasterCatalogs } from '../types/downtime';
import { getISOWeekNumber } from '../utils/dateUtils';
import { PlusCircle } from 'lucide-react';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DowntimeRecord) => void;
  catalogs: MasterCatalogs;
}

export const NewEntryModal: React.FC<NewEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  catalogs,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [line, setLine] = useState(catalogs.lines[0] || 'Línea 1 - Envasado Líquidos');
  const [machine, setMachine] = useState(catalogs.machines[0] || 'Llenadora Isométrica 32V');
  const [customMachine, setCustomMachine] = useState('');
  const [problem, setProblem] = useState<string>(catalogs.problems[0]?.name || '');
  const [customProblem, setCustomProblem] = useState('');
  const [category, setCategory] = useState<string>(catalogs.categories[0] || 'Mecánico');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [shift, setShift] = useState<string>(catalogs.shifts[0] || '1');
  const [rootCauseNotes, setRootCauseNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  if (!isOpen) return null;

  const calculatedWeek = getISOWeekNumber(date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProblem = problem === 'OTRO' ? customProblem.trim() : problem;
    const finalMachine = machine === 'OTRO' ? customMachine.trim() : machine;

    if (!finalProblem) {
      alert('Por favor especifica el problema o falla.');
      return;
    }
    if (!finalMachine) {
      alert('Por favor especifica la máquina donde se originó el paro.');
      return;
    }

    const newRecord: DowntimeRecord = {
      id: `DT-${calculatedWeek}${Math.floor(10 + Math.random() * 90)}`,
      date,
      weekOfYear: calculatedWeek,
      productionLine: line,
      machine: finalMachine,
      problem: finalProblem,
      category,
      durationMinutes: Number(durationMinutes) || 1,
      shift,
      rootCauseNotes: rootCauseNotes.trim(),
      actionTaken: actionTaken.trim(),
    };

    onSave(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Registrar Paro de Producción (Tiempo Muerto)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Asigna la máquina causante y alimenta los diagramas de Pareto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form with scrollable body and sticky footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* Row 1: Date & Auto Week */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Fecha del Incidente:
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Semana del Año (ISO-8601):
                </label>
                <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg font-mono font-bold text-blue-700">
                  Semana {calculatedWeek} (W{calculatedWeek})
                </div>
              </div>
            </div>

          {/* Row 2: Line & Machine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Línea de Producción:
              </label>
              <select
                value={line}
                onChange={(e) => setLine(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {catalogs.lines.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Máquina / Equipo donde ocurrió el paro:
              </label>
              <select
                value={machine}
                onChange={(e) => setMachine(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {catalogs.machines.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="OTRO">+ Otra máquina nueva...</option>
              </select>
            </div>
          </div>

          {machine === 'OTRO' && (
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Nombre de la Nueva Máquina:
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Etiquetadora Rotativa Krones..."
                value={customMachine}
                onChange={(e) => setCustomMachine(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          )}

          {/* Row 3: Problem & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Falla / Problema Detectado:
              </label>
              <select
                value={problem}
                onChange={(e) => {
                  setProblem(e.target.value);
                  const found = catalogs.problems.find((p) => p.name === e.target.value);
                  if (found) setCategory(found.category);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {catalogs.problems.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
                <option value="OTRO">+ Otra falla nueva no listada...</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Categoría Técnica:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {catalogs.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {problem === 'OTRO' && (
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Especificar Nombre de la Nueva Falla:
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Fuga en sello de bomba dosificadora..."
                value={customProblem}
                onChange={(e) => setCustomProblem(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          )}

          {/* Row 4: Duration & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Duración del Paro (Minutos):
              </label>
              <input
                type="number"
                min="1"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Turno de Trabajo:
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {catalogs.shifts.map((s) => (
                  <option key={s} value={s}>
                    {s.startsWith('Turno') ? s : `Turno ${s}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Notes & Actions */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Descripción Causa Raíz (5 Porqués / FMEA):
            </label>
            <textarea
              rows={2}
              placeholder="Detalle de la anomalía observada en la máquina, pieza dañada..."
              value={rootCauseNotes}
              onChange={(e) => setRootCauseNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Acción Correctiva Ejecutada:
            </label>
            <input
              type="text"
              placeholder="Ajuste mecánico, recambio de refacción, calibración de sensor..."
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          </div>

          {/* Sticky Action buttons footer */}
          <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium cursor-pointer transition-colors shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Guardar e Integrar al Pareto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
