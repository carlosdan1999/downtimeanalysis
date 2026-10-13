import React, { useState } from 'react';
import { MasterCatalogs } from '../types/downtime';
import {
  Factory,
  Cpu,
  AlertTriangle,
  Layers,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Settings2,
} from 'lucide-react';

interface CatalogManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogs: MasterCatalogs;
  onUpdateCatalogs: (
    newCatalogs: MasterCatalogs,
    renamedLine?: { oldName: string; newName: string },
    renamedMachine?: { oldName: string; newName: string },
    renamedProblem?: { oldName: string; newName: string; category: string }
  ) => void;
}

type CatalogTab = 'lines' | 'machines' | 'problems' | 'categories' | 'shifts';

export const CatalogManagerModal: React.FC<CatalogManagerModalProps> = ({
  isOpen,
  onClose,
  catalogs,
  onUpdateCatalogs,
}) => {
  const [activeTab, setActiveTab] = useState<CatalogTab>('lines');

  // Input states for new items
  const [newLineName, setNewLineName] = useState('');
  const [newMachineName, setNewMachineName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newShiftName, setNewShiftName] = useState('');
  const [newProblemName, setNewProblemName] = useState('');
  const [newProblemCat, setNewProblemCat] = useState(catalogs.categories[0] || 'Mecánico');

  // Inline editing states
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editSecondaryValue, setEditSecondaryValue] = useState('');

  if (!isOpen) return null;

  // 1. Line handlers
  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLineName.trim();
    if (!trimmed) return;
    if (catalogs.lines.includes(trimmed)) {
      alert('Esta línea ya está en la lista.');
      return;
    }
    const updated = { ...catalogs, lines: [...catalogs.lines, trimmed] };
    onUpdateCatalogs(updated);
    setNewLineName('');
  };

  const handleSaveEditLine = (index: number) => {
    const oldName = catalogs.lines[index];
    const newName = editValue.trim();
    if (!newName) return;
    if (oldName !== newName && catalogs.lines.includes(newName)) {
      alert('Ya existe una línea con este nombre.');
      return;
    }
    const nextLines = [...catalogs.lines];
    nextLines[index] = newName;
    onUpdateCatalogs({ ...catalogs, lines: nextLines }, { oldName, newName });
    setEditingItemIndex(null);
  };

  const handleDeleteLine = (line: string) => {
    if (catalogs.lines.length <= 1) {
      alert('Debe existir al menos una línea de producción.');
      return;
    }
    if (confirm(`¿Eliminar "${line}" del catálogo?`)) {
      onUpdateCatalogs({
        ...catalogs,
        lines: catalogs.lines.filter((l) => l !== line),
      });
    }
  };

  // 2. Machine handlers
  const handleAddMachine = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMachineName.trim();
    if (!trimmed) return;
    if (catalogs.machines.includes(trimmed)) {
      alert('Esta máquina ya está en la lista.');
      return;
    }
    const updated = { ...catalogs, machines: [...catalogs.machines, trimmed] };
    onUpdateCatalogs(updated);
    setNewMachineName('');
  };

  const handleSaveEditMachine = (index: number) => {
    const oldName = catalogs.machines[index];
    const newName = editValue.trim();
    if (!newName) return;
    if (oldName !== newName && catalogs.machines.includes(newName)) {
      alert('Ya existe una máquina con este nombre.');
      return;
    }
    const nextMachines = [...catalogs.machines];
    nextMachines[index] = newName;
    onUpdateCatalogs(
      { ...catalogs, machines: nextMachines },
      undefined,
      { oldName, newName }
    );
    setEditingItemIndex(null);
  };

  const handleDeleteMachine = (m: string) => {
    if (catalogs.machines.length <= 1) {
      alert('Debe existir al menos una máquina en el catálogo.');
      return;
    }
    if (confirm(`¿Eliminar "${m}" del catálogo?`)) {
      onUpdateCatalogs({
        ...catalogs,
        machines: catalogs.machines.filter((x) => x !== m),
      });
    }
  };

  // 3. Problem handlers
  const handleAddProblem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProblemName.trim();
    if (!trimmed) return;
    if (catalogs.problems.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Ya existe este problema en el catálogo.');
      return;
    }
    const updated: MasterCatalogs = {
      ...catalogs,
      problems: [...catalogs.problems, { name: trimmed, category: newProblemCat }],
    };
    onUpdateCatalogs(updated);
    setNewProblemName('');
  };

  const handleSaveEditProblem = (index: number) => {
    const oldProblem = catalogs.problems[index];
    const newName = editValue.trim();
    const newCat = editSecondaryValue || oldProblem.category;
    if (!newName) return;

    const nextProblems = [...catalogs.problems];
    nextProblems[index] = { name: newName, category: newCat };
    onUpdateCatalogs(
      { ...catalogs, problems: nextProblems },
      undefined,
      undefined,
      { oldName: oldProblem.name, newName, category: newCat }
    );
    setEditingItemIndex(null);
  };

  const handleDeleteProblem = (probName: string) => {
    if (catalogs.problems.length <= 1) {
      alert('Debe existir al menos un problema en el catálogo.');
      return;
    }
    if (confirm(`¿Eliminar "${probName}" del catálogo?`)) {
      onUpdateCatalogs({
        ...catalogs,
        problems: catalogs.problems.filter((p) => p.name !== probName),
      });
    }
  };

  // 4. Category handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (catalogs.categories.includes(trimmed)) {
      alert('Esta categoría ya existe.');
      return;
    }
    onUpdateCatalogs({
      ...catalogs,
      categories: [...catalogs.categories, trimmed],
    });
    setNewCatName('');
  };

  const handleSaveEditCategory = (index: number) => {
    const oldCat = catalogs.categories[index];
    const newCat = editValue.trim();
    if (!newCat) return;

    const nextCats = [...catalogs.categories];
    nextCats[index] = newCat;
    const nextProbs = catalogs.problems.map((p) =>
      p.category === oldCat ? { ...p, category: newCat } : p
    );

    onUpdateCatalogs({
      ...catalogs,
      categories: nextCats,
      problems: nextProbs,
    });
    setEditingItemIndex(null);
  };

  const handleDeleteCategory = (cat: string) => {
    if (catalogs.categories.length <= 1) {
      alert('Debe existir al menos una categoría.');
      return;
    }
    if (confirm(`¿Eliminar la categoría "${cat}"?`)) {
      onUpdateCatalogs({
        ...catalogs,
        categories: catalogs.categories.filter((c) => c !== cat),
      });
    }
  };

  // 5. Shift handlers
  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newShiftName.trim();
    if (!trimmed) return;
    if (catalogs.shifts.includes(trimmed)) {
      alert('Este turno ya existe.');
      return;
    }
    onUpdateCatalogs({
      ...catalogs,
      shifts: [...catalogs.shifts, trimmed],
    });
    setNewShiftName('');
  };

  const handleSaveEditShift = (index: number) => {
    const newShift = editValue.trim();
    if (!newShift) return;
    const nextShifts = [...catalogs.shifts];
    nextShifts[index] = newShift;
    onUpdateCatalogs({ ...catalogs, shifts: nextShifts });
    setEditingItemIndex(null);
  };

  const handleDeleteShift = (shift: string) => {
    if (catalogs.shifts.length <= 1) {
      alert('Debe existir al menos un turno.');
      return;
    }
    if (confirm(`¿Eliminar "${shift}"?`)) {
      onUpdateCatalogs({
        ...catalogs,
        shifts: catalogs.shifts.filter((s) => s !== shift),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Configuración de Catálogos & Parámetros
              </h3>
              <p className="text-xs text-slate-500">
                Administra líneas, máquinas, fallas, categorías y turnos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection (Horizontal scrolling for mobile) */}
        <div className="px-3 sm:px-5 pt-3 pb-2 shrink-0 bg-white border-b border-slate-100">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-medium">
            <button
              onClick={() => {
                setActiveTab('lines');
                setEditingItemIndex(null);
              }}
              className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'lines'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Líneas ({catalogs.lines.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('machines');
                setEditingItemIndex(null);
              }}
              className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'machines'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Máquinas ({catalogs.machines.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('problems');
                setEditingItemIndex(null);
              }}
              className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'problems'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Fallas ({catalogs.problems.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('categories');
                setEditingItemIndex(null);
              }}
              className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'categories'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Categorías ({catalogs.categories.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('shifts');
                setEditingItemIndex(null);
              }}
              className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'shifts'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Turnos ({catalogs.shifts.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Content & List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* TAB 1: LÍNEAS */}
          {activeTab === 'lines' && (
            <div>
              <form onSubmit={handleAddLine} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nombre de la nueva línea (Ej: Línea 6 - Envasado Aséptico)"
                  value={newLineName}
                  onChange={(e) => setNewLineName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                {catalogs.lines.map((line, idx) => (
                  <div
                    key={line}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                  >
                    {editingItemIndex === idx ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-white border border-blue-400 rounded-md focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditLine(idx)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItemIndex(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-800">{line}</span>
                    )}

                    {editingItemIndex !== idx && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItemIndex(idx);
                            setEditValue(line);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Renombrar línea"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLine(line)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar línea"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MÁQUINAS / EQUIPOS */}
          {activeTab === 'machines' && (
            <div>
              <form onSubmit={handleAddMachine} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nombre de la nueva máquina (Ej: Envasadora Tetra Pak A3)"
                  value={newMachineName}
                  onChange={(e) => setNewMachineName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Máquina
                </button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                {catalogs.machines.map((machine, idx) => (
                  <div
                    key={machine}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                  >
                    {editingItemIndex === idx ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-white border border-blue-400 rounded-md focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditMachine(idx)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItemIndex(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-800">{machine}</span>
                    )}

                    {editingItemIndex !== idx && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItemIndex(idx);
                            setEditValue(machine);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Renombrar máquina"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMachine(machine)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar máquina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PROBLEMAS / FALLAS */}
          {activeTab === 'problems' && (
            <div>
              <form onSubmit={handleAddProblem} className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nombre de la falla (Ej: Desgaste en sellos de pistón)"
                  value={newProblemName}
                  onChange={(e) => setNewProblemName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <select
                  value={newProblemCat}
                  onChange={(e) => setNewProblemCat(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                >
                  {catalogs.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                {catalogs.problems.map((prob, idx) => (
                  <div
                    key={`${prob.name}-${idx}`}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                  >
                    {editingItemIndex === idx ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-white border border-blue-400 rounded-md focus:outline-none"
                          autoFocus
                        />
                        <select
                          value={editSecondaryValue}
                          onChange={(e) => setEditSecondaryValue(e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-md focus:outline-none"
                        >
                          {catalogs.categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveEditProblem(idx)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItemIndex(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900">{prob.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          {prob.category}
                        </span>
                      </div>
                    )}

                    {editingItemIndex !== idx && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItemIndex(idx);
                            setEditValue(prob.name);
                            setEditSecondaryValue(prob.category);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Editar problema y categoría"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProblem(prob.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar problema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORÍAS */}
          {activeTab === 'categories' && (
            <div>
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nombre de la nueva categoría (Ej: Neumática / Fluidos)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Categoría
                </button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                {catalogs.categories.map((cat, idx) => (
                  <div
                    key={cat}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                  >
                    {editingItemIndex === idx ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-white border border-blue-400 rounded-md focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditCategory(idx)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItemIndex(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-800">{cat}</span>
                    )}

                    {editingItemIndex !== idx && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItemIndex(idx);
                            setEditValue(cat);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TURNOS */}
          {activeTab === 'shifts' && (
            <div>
              <form onSubmit={handleAddShift} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nombre del nuevo turno (Ej: 1, 2, 3 o Turno Especial)"
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Turno
                </button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                {catalogs.shifts.map((shift, idx) => (
                  <div
                    key={shift}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                  >
                    {editingItemIndex === idx ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-white border border-blue-400 rounded-md focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditShift(idx)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItemIndex(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-800">{shift}</span>
                    )}

                    {editingItemIndex !== idx && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItemIndex(idx);
                            setEditValue(shift);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
