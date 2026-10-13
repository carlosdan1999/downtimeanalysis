import React, { useState, useEffect } from 'react';
import { DowntimeRecord, MasterCatalogs } from '../types/downtime';
import { getISOWeekNumber } from '../utils/dateUtils';
import { Trash2, Edit3 } from 'lucide-react';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DowntimeRecord | null;
  onSave: (updatedRecord: DowntimeRecord) => void;
  onDelete?: (id: string) => void;
  catalogs: MasterCatalogs;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
  onDelete,
  catalogs,
}) => {
  const [date, setDate] = useState('');
  const [line, setLine] = useState('');
  const [machine, setMachine] = useState('');
  const [problem, setProblem] = useState('');
  const [category, setCategory] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [shift, setShift] = useState('');
  const [rootCauseNotes, setRootCauseNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  useEffect(() => {
    if (record) {
      setDate(record.date);
      setLine(record.productionLine);
      setMachine(record.machine);
      setProblem(record.problem);
      setCategory(record.category);
      setDurationMinutes(record.durationMinutes);
      setShift(record.shift);
      setRootCauseNotes(record.rootCauseNotes || '');
      setActionTaken(record.actionTaken || '');
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const calculatedWeek = getISOWeekNumber(date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) {
      alert('Por favor especifica el problema o falla.');
      return;
    }
    if (!machine.trim()) {
      alert('Por favor especifica la máquina.');
      return;
    }

    const updated: DowntimeRecord = {
      ...record,
      date,
      weekOfYear: calculatedWeek,
      productionLine: line,
      machine: machine.trim(),
      problem: problem.trim(),
      category: category.trim(),
      durationMinutes: Number(durationMinutes) || 1,
      shift,
      rootCauseNotes: rootCauseNotes.trim(),
      actionTaken: actionTaken.trim(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Editar Registro de Paro · <span className="font-mono text-blue-600">{record.id}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Modifica los valores del evento de tiempo muerto o elimina el registro
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* Row 1: Date & Week */}
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Semana del Año (Auto):
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
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                Máquina / Equipo:
              </label>
              <input
                type="text"
                required
                value={machine}
                onChange={(e) => setMachine(e.target.value)}
                list="edit-machine-suggestions"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="edit-machine-suggestions">
                {catalogs.machines.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 3: Problem & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Problema / Falla:
              </label>
              <input
                type="text"
                required
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                list="edit-problem-suggestions"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="edit-problem-suggestions">
                {catalogs.problems.map((p) => (
                  <option key={p.name} value={p.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Categoría Técnica:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {catalogs.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Turno de Trabajo:
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              Análisis Causa Raíz:
            </label>
            <textarea
              rows={2}
              value={rootCauseNotes}
              onChange={(e) => setRootCauseNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Acción Correctiva:
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          </div>

          {/* Sticky Action buttons footer */}
          <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2.5 shrink-0">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `¿Confirmas eliminar permanentemente el registro ${record.id} de la máquina "${record.machine}"?`
                    )
                  ) {
                    onDelete(record.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs transition-colors shadow-2xs"
                title="Eliminar este registro de paro"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar Registro</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
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
                Guardar Modificación
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
