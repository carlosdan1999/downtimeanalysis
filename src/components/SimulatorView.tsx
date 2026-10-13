import React, { useState } from 'react';
import { DowntimeRecord, ParetoAnalysisResult, TimeUnit } from '../types/downtime';
import { simulateParetoReduction } from '../utils/pareto';
import { formatHoursDecimal, formatDuration } from '../utils/dateUtils';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface SimulatorViewProps {
  records: DowntimeRecord[];
  analysis: ParetoAnalysisResult;
  timeUnit?: TimeUnit;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  records,
  analysis,
  timeUnit = 'hours',
}) => {
  // Preselect top 2 vital few problems
  const topVitalKeys = analysis.items.slice(0, 2).map((i) => i.key);
  const [selectedToEliminate, setSelectedToEliminate] = useState<Set<string>>(
    new Set(topVitalKeys)
  );

  const toggleProblem = (problemKey: string) => {
    setSelectedToEliminate((prev) => {
      const next = new Set(prev);
      if (next.has(problemKey)) {
        next.delete(problemKey);
      } else {
        next.add(problemKey);
      }
      return next;
    });
  };

  const simulation = simulateParetoReduction(records, selectedToEliminate);

  const getLeanRecommendation = (label: string, category?: string) => {
    if (label.toLowerCase().includes('formato') || label.toLowerCase().includes('smed')) {
      return 'Implementar metodología SMED (Single Minute Exchange of Die) y listas de chequeo 5S.';
    }
    if (label.toLowerCase().includes('banda') || label.toLowerCase().includes('atasco')) {
      return 'Mantenimiento preventivo en guías, lubricación de rodillos y sensores de sobrepar.';
    }
    if (label.toLowerCase().includes('sensor') || label.toLowerCase().includes('plc')) {
      return 'Poka-Yoke de posicionamiento, blindaje contra vibración y redundancia óptica.';
    }
    if (category === 'Suministro / Material') {
      return 'Auditoría a proveedor y sistema Kanban visual de reposición preventiva.';
    }
    return 'Inspección de Mantenimiento Autónomo (TPM) y plan de contingencia rápido.';
  };

  return (
    <div className="space-y-6">
      {/* Simulation High-Tech Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-xl p-6 shadow-md border border-blue-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-300 font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Simulador de Mejora Continua Kaizen / TPM
            </div>
            <h3 className="text-xl font-extrabold mt-1 text-white tracking-tight">
              Proyección de Reducción de Tiempo Muerto (Ley 80/20)
            </h3>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Selecciona las fallas críticas de la lista vital para simular el impacto en horas de producción recuperadas si se eliminan mediante acciones de ingeniería y mantenimiento preventivo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const allVital = new Set(
                  analysis.items.filter((i) => i.isVitalFew).map((i) => i.key)
                );
                setSelectedToEliminate(allVital);
              }}
              className="px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-900 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Seleccionar Todas las Vitales
            </button>
            <button
              onClick={() => setSelectedToEliminate(new Set())}
              className="px-3 py-2 bg-blue-900/60 hover:bg-blue-900 text-blue-200 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-blue-400/30"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Projected Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-blue-500/40 font-mono">
          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10">
            <span className="text-[11px] text-blue-200 font-sans font-medium block">
              Tiempo Ahorrado Proyectado:
            </span>
            <div className="text-2xl font-bold text-cyan-300 mt-0.5">
              {formatDuration(simulation.savedMinutes, timeUnit)}
            </div>
            <span className="text-[11px] text-blue-200 font-sans">
              de {formatDuration(simulation.originalDuration, timeUnit)} acumulado inicial
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10">
            <span className="text-[11px] text-blue-200 font-sans font-medium block">
              Reducción de Tiempo Muerto:
            </span>
            <div className="text-2xl font-bold text-emerald-300 mt-0.5">
              -{simulation.percentageReduced.toFixed(1)}%
            </div>
            <span className="text-[11px] text-blue-200 font-sans">
              Ganancia directa en disponibilidad operativa
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10">
            <span className="text-[11px] text-blue-200 font-sans font-medium block">
              Tiempo Muerto Residual:
            </span>
            <div className="text-2xl font-bold text-white mt-0.5">
              {formatDuration(simulation.newDuration, timeUnit)}
            </div>
            <span className="text-[11px] text-blue-200 font-sans">
              {simulation.remainingRecordsCount} eventos restantes estimados
            </span>
          </div>
        </div>
      </div>

      {/* Problem Selection & Lean Actions Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-1 tracking-tight">
          Plan de Ataque a Fallas (Matriz de Priorización)
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Marca las casillas de los problemas que tu equipo de mantenimiento y operaciones se comprometerá a intervenir:
        </p>

        <div className="space-y-3">
          {analysis.items.map((item) => {
            const isEliminated = selectedToEliminate.has(item.key);
            const recommendation = getLeanRecommendation(item.label, item.category);

            return (
              <div
                key={item.key}
                onClick={() => toggleProblem(item.key)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isEliminated
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isEliminated}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 rounded-xs border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {item.label}
                      </span>
                      {item.isVitalFew && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          Vital 80%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      <span className="font-semibold text-slate-700">
                        Estrategia sugerida:
                      </span>{' '}
                      {recommendation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono shrink-0 pl-7 md:pl-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-sans block font-medium">
                      Tiempo Muerto
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatHoursDecimal(item.value)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-sans block font-medium">
                      % del Total
                    </span>
                    <span className="font-bold text-blue-700">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-sans block font-medium">
                      Eventos
                    </span>
                    <span className="font-bold text-slate-800">
                      {item.count} paradas
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
