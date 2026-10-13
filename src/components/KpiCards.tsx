import React from 'react';
import { ParetoAnalysisResult, TimeUnit } from '../types/downtime';
import { formatHoursDecimal } from '../utils/dateUtils';
import { Clock, Activity, Target, AlertTriangle } from 'lucide-react';

interface KpiCardsProps {
  analysis: ParetoAnalysisResult;
  metricType: 'problem' | 'line' | 'week' | 'machine' | 'day' | 'month';
  timeUnit?: TimeUnit;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  analysis,
  metricType,
  timeUnit = 'hours',
}) => {
  const totalMinutes = analysis.items.reduce((acc, i) => acc + (i.value || 0), 0);
  const totalEvents = analysis.totalCount;
  const mttrMinutes = totalEvents > 0 ? totalMinutes / totalEvents : 0;
  const topItem = analysis.items[0];

  const getMetricTypeLabel = () => {
    switch (metricType) {
      case 'problem':
        return 'causas';
      case 'line':
        return 'líneas';
      case 'machine':
        return 'máquinas';
      case 'week':
        return 'semanas';
      case 'day':
        return 'días';
      case 'month':
        return 'meses';
      default:
        return 'elementos';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: Tiempo Muerto Total */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-blue-300 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
          <span>Tiempo Muerto Total</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
          {timeUnit === 'minutes'
            ? `${Math.round(totalMinutes).toLocaleString('es-MX')} min`
            : formatHoursDecimal(totalMinutes)}
        </div>
        <div className="text-xs text-slate-500 mt-1 font-medium">
          {timeUnit === 'minutes'
            ? `${formatHoursDecimal(totalMinutes)} equivalentes`
            : `${Math.round(totalMinutes).toLocaleString('es-MX')} minutos acumulados`}
        </div>
      </div>

      {/* KPI 2: Total de Eventos de Paro */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-blue-300 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
          <span>Frecuencia de Paradas</span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
          {totalEvents}{' '}
          <span className="text-xs font-normal text-slate-500">eventos</span>
        </div>
        <div className="text-xs text-slate-500 mt-1 font-medium">
          Incidentes de inactividad registrados
        </div>
      </div>

      {/* KPI 3: MTTR Promedio */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-amber-300 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
          <span>MTTR Promedio (Tiempo de Reparación)</span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
          {timeUnit === 'minutes'
            ? `${Math.round(mttrMinutes)} min`
            : `${(mttrMinutes / 60).toFixed(2)} h`}
          <span className="text-xs font-normal text-slate-500 ml-1">/ evento</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {timeUnit === 'minutes'
            ? `${(mttrMinutes / 60).toFixed(2)} h por cada incidente`
            : `${Math.round(mttrMinutes)} min de duración media`}
        </div>
      </div>

      {/* KPI 4: Concentración 80/20 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-blue-300 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
          <span>Foco Pareto (Vital Few)</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tracking-tight text-blue-600">
          {analysis.vitalFewCount}{' '}
          <span className="text-xs font-normal text-slate-500">
            de {analysis.items.length} {getMetricTypeLabel()}
          </span>
        </div>
        <div className="text-xs text-slate-600 mt-1 truncate font-medium">
          #1 Crítico:{' '}
          <span className="text-slate-900 font-bold" title={topItem?.label}>
            {topItem ? `${topItem.label} (${topItem.percentage.toFixed(0)}%)` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
