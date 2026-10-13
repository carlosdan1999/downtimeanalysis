import React, { useState, useMemo, useRef } from 'react';
import { DowntimeRecord, ParetoMetric, TimeUnit } from '../types/downtime';
import { formatHoursDecimal, formatDuration } from '../utils/dateUtils';
import { ExportPngButton } from './ExportPngButton';
import { exportTo1080pFullHdPng } from '../utils/exportToPng';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';

interface WeeklyTrendChartProps {
  records: DowntimeRecord[];
  metric: ParetoMetric;
  timeUnit: TimeUnit;
  selectedWeek?: number | null;
  onSelectWeek?: (weekNumber: number) => void;
  title?: string;
  subtitle?: string;
}

export interface WeekTrendPoint {
  week: number;
  label: string;
  minutes: number;
  hours: number;
  eventCount: number;
  value: number; // minutes or hours depending on timeUnit, or eventCount if metric is frequency
  deltaPercentage: number | null; // vs previous week
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({
  records,
  metric,
  timeUnit,
  selectedWeek,
  onSelectWeek,
  title = 'Tendencia Semanal del Tiempo Muerto Total',
  subtitle = 'Comportamiento cronológico acumulado a lo largo de las semanas de operación',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group records by week chronologically
  const weekData = useMemo<WeekTrendPoint[]>(() => {
    if (records.length === 0) return [];

    // Find all distinct weeks present in the records
    const weekMap = new Map<number, { minutes: number; count: number }>();

    // Also determine min and max week
    let minW = Infinity;
    let maxW = -Infinity;

    records.forEach((r) => {
      const w = r.weekOfYear;
      if (w !== undefined && w !== null && !isNaN(w)) {
        minW = Math.min(minW, w);
        maxW = Math.max(maxW, w);
        const cur = weekMap.get(w) || { minutes: 0, count: 0 };
        cur.minutes += r.durationMinutes;
        cur.count += 1;
        weekMap.set(w, cur);
      }
    });

    if (minW === Infinity) return [];

    // Create a continuous sequence of weeks from min to max, ensuring zero-downtime weeks are visible
    const points: WeekTrendPoint[] = [];
    let prevVal: number | null = null;

    for (let w = minW; w <= maxW; w++) {
      const data = weekMap.get(w) || { minutes: 0, count: 0 };
      const hours = data.minutes / 60;

      let value = 0;
      if (metric === 'duration') {
        value = timeUnit === 'minutes' ? data.minutes : hours;
      } else {
        value = data.count;
      }

      let deltaPercentage: number | null = null;
      if (prevVal !== null && prevVal > 0) {
        deltaPercentage = ((value - prevVal) / prevVal) * 100;
      } else if (prevVal === 0 && value > 0) {
        deltaPercentage = 100;
      }

      points.push({
        week: w,
        label: `Semana ${w}`,
        minutes: data.minutes,
        hours,
        eventCount: data.count,
        value,
        deltaPercentage,
      });

      prevVal = value;
    }

    return points;
  }, [records, metric, timeUnit]);

  // Overall metrics summary
  const summary = useMemo(() => {
    if (weekData.length === 0) {
      return {
        totalMinutes: 0,
        totalEvents: 0,
        avgValue: 0,
        maxValue: 0,
        peakWeek: null as WeekTrendPoint | null,
        lowestWeek: null as WeekTrendPoint | null,
        trendDirection: 'stable' as 'up' | 'down' | 'stable',
      };
    }

    const totalMinutes = weekData.reduce((acc, p) => acc + p.minutes, 0);
    const totalEvents = weekData.reduce((acc, p) => acc + p.eventCount, 0);
    const totalVal = weekData.reduce((acc, p) => acc + p.value, 0);
    const avgValue = totalVal / weekData.length;

    let peakWeek = weekData[0];
    let lowestWeek = weekData[0];

    weekData.forEach((p) => {
      if (p.value > peakWeek.value) peakWeek = p;
      if (p.value < lowestWeek.value) lowestWeek = p;
    });

    // Simple trend estimation: compare last 2 weeks or first half vs second half
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (weekData.length >= 2) {
      const first = weekData[0].value;
      const last = weekData[weekData.length - 1].value;
      if (last > first * 1.05) trendDirection = 'up';
      else if (last < first * 0.95) trendDirection = 'down';
    }

    return {
      totalMinutes,
      totalEvents,
      avgValue,
      maxValue: peakWeek.value,
      peakWeek,
      lowestWeek,
      trendDirection,
    };
  }, [weekData]);

  if (weekData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-xs">
        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-700">Sin datos de semanas para graficar</h4>
        <p className="text-xs text-slate-400 mt-1">
          Ajusta los filtros de semanas o registra nuevos eventos de tiempo muerto.
        </p>
      </div>
    );
  }

  // SVG Geometry Dimensions - calibrated for crisp presentation slide with clear category separation
  const svgWidth = 920;
  const svgHeight = 340;
  const padLeft = 68;
  const padRight = 62;
  const padTop = 46;
  const padBottom = 76;

  const innerW = svgWidth - padLeft - padRight;
  const innerH = svgHeight - padTop - padBottom;

  // Max scale calculation with 25% headroom so angled labels fit comfortably
  const rawMax = Math.max(...weekData.map((d) => d.value), 1);
  const yMax = rawMax * 1.25;

  // Coordinate helper functions
  const getX = (index: number) => {
    if (weekData.length === 1) return padLeft + innerW / 2;
    return padLeft + (index / (weekData.length - 1)) * innerW;
  };

  const getY = (val: number) => {
    return padTop + innerH - (val / yMax) * innerH;
  };

  // Generate SVG Path for line and area
  const linePoints = weekData.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const linePath = `M ${linePoints.join(' L ')}`;

  const baselineY = padTop + innerH;
  const areaPath = `M ${getX(0)},${baselineY} L ${linePoints.join(' L ')} L ${getX(
    weekData.length - 1
  )},${baselineY} Z`;

  // Average line Y coordinate
  const avgY = getY(summary.avgValue);

  // Y-axis ticks (4 ticks)
  const yTicks = [0, yMax * 0.33, yMax * 0.66, yMax];

  // Formatting helpers
  const formatValWithUnit = (val: number) => {
    if (metric === 'duration') {
      return timeUnit === 'minutes'
        ? `${Math.round(val).toLocaleString('es-MX')} min`
        : `${val.toFixed(1)} h`;
    }
    return `${Math.round(val)} paros`;
  };

  const activePoint = hoveredIndex !== null ? weekData[hoveredIndex] : null;

  const handleExport1080 = async () => {
    const metricLabel =
      metric === 'duration'
        ? timeUnit === 'minutes'
          ? 'Minutos'
          : 'Horas'
        : 'Número de Paros';

    await exportTo1080pFullHdPng({
      filename: `grafica_tendencia_semanal_total_1080p_full_hd.png`,
      title: title || 'Tendencia Semanal del Tiempo Muerto Total',
      subtitle: `${subtitle} · ${weekData.length} Semanas Monitoreadas · Unidad: ${metricLabel}`,
      legendItems: [
        { label: 'Tiempo Muerto Total Semanal', color: '#2563eb', type: 'line' },
        { label: `Promedio del Periodo (${formatValWithUnit(summary.avgValue)})`, color: '#64748b', type: 'dashed' },
        { label: summary.peakWeek ? `Semana Pico Crítico (W${summary.peakWeek.week}: ${formatValWithUnit(summary.peakWeek.value)})` : 'Semana Pico Crítico', color: '#f59e0b', type: 'circle' },
      ],
      kpis: [
        { label: 'Promedio Semanal', value: formatValWithUnit(summary.avgValue) },
        { label: 'Semana Pico', value: summary.peakWeek ? `W${summary.peakWeek.week}` : 'N/A', color: '#d97706' },
        { label: 'Tendencia', value: summary.trendDirection === 'down' ? 'Favorable' : summary.trendDirection === 'up' ? 'Al Alza' : 'Estable' },
      ],
      svgElement: svgRef.current,
      element: cardRef.current,
      footerNote: 'Sistema de Control de Tiempo Muerto · Monitoreo y Evolución Cronológica para Presentación',
    });
  };

  return (
    <div ref={cardRef} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header with Title and Legend strictly in the upper-left corner */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-3 border-b border-slate-100">
        {/* Esquina superior izquierda: Título, Subtítulo y Leyenda */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
              <span className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {weekData.length} semanas auditadas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>

          {/* Leyenda en la esquina superior izquierda */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-1 bg-blue-600 rounded-full" />
              <span className="font-semibold text-slate-800">Tiempo Muerto Total Semanal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-0.5 bg-slate-500 border-t border-dashed border-slate-500" />
              <span className="text-slate-600">Promedio ({formatValWithUnit(summary.avgValue)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-amber-700 font-semibold">Semana Crítica Pico</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights Chips and Export in upper-right corner */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          {/* Promedio Semanal */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Promedio:</span>
            <span className="font-mono text-xs font-bold text-slate-900">
              {formatValWithUnit(summary.avgValue)}
            </span>
          </div>

          {/* Semana Pico Crítica */}
          {summary.peakWeek && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <span className="text-[10px] text-amber-800 uppercase font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Pico:
              </span>
              <span className="font-mono text-xs font-bold text-amber-900">
                W{summary.peakWeek.week} ({formatValWithUnit(summary.peakWeek.value)})
              </span>
            </div>
          )}

          {/* Tendencia Global */}
          <div
            className={`border rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold ${
              summary.trendDirection === 'down'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : summary.trendDirection === 'up'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {summary.trendDirection === 'down' ? (
              <>
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tendencia Favorable</span>
              </>
            ) : summary.trendDirection === 'up' ? (
              <>
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                <span>Al Alza</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                <span>Estable</span>
              </>
            )}
          </div>

          {/* Export PNG Button */}
          <ExportPngButton
            targetRef={cardRef}
            onCustomExport={handleExport1080}
            filename={`grafica_tendencia_semanal_total_1080p_full_hd.png`}
            label="Descargar PNG (1080p Full HD)"
            tooltip="Guardar gráfica completa de tendencia semanal en alta resolución 1080p Full HD (1920x1080) para diapositivas con etiquetas legibles"
          />
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 sm:h-72 select-none overflow-visible"
        >
          <defs>
            {/* Gradient fill under the trendline */}
            <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
            </linearGradient>

            {/* Glowing filter for highlighted dots */}
            <filter id="dotGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1d4ed8" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Grid lines and Left Y-Axis Ticks (without Y-axis title per user request) */}
          {yTicks.map((tickVal, idx) => {
            const yPos = getY(tickVal);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={svgWidth - padRight}
                  y2={yPos}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={idx === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 10}
                  y={yPos + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500 font-mono font-medium"
                >
                  {formatValWithUnit(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Reference Line: Promedio Semanal */}
          {summary.avgValue > 0 && (
            <g>
              <line
                x1={padLeft}
                y1={avgY}
                x2={svgWidth - padRight}
                y2={avgY}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x={svgWidth - padRight + 4}
                y={avgY + 3.5}
                textAnchor="start"
                className="text-[9px] fill-slate-500 font-mono font-bold"
              >
                Prom: {formatValWithUnit(summary.avgValue)}
              </text>
            </g>
          )}

          {/* Area fill under curve */}
          <path d={areaPath} fill="url(#trendAreaGradient)" />

          {/* Main trendline stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Crosshair Guide */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padTop}
                x2={getX(hoveredIndex)}
                y2={padTop + innerH}
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </g>
          )}

          {/* Data Points on the line */}
          {weekData.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.value);
            const isHovered = hoveredIndex === i;
            const isSelected = selectedWeek === d.week;
            const isPeak = summary.peakWeek?.week === d.week;

            return (
              <g
                key={d.week}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectWeek && onSelectWeek(d.week)}
              >
                {/* Invisible hit box for easier mouse hovering */}
                <rect
                  x={cx - 18}
                  y={padTop}
                  width={36}
                  height={innerH + padBottom}
                  fill="transparent"
                />

                {/* Outer halo if peak or selected */}
                {(isPeak || isSelected || isHovered) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 11 : 9}
                    fill={isPeak ? '#f59e0b' : '#3b82f6'}
                    fillOpacity="0.2"
                    className="transition-all duration-150"
                  />
                )}

                {/* Dot marker */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6.5 : isSelected ? 5.5 : 4}
                  fill={isPeak ? '#d97706' : isSelected ? '#1e40af' : '#ffffff'}
                  stroke={isPeak ? '#b45309' : '#2563eb'}
                  strokeWidth={isHovered ? 3 : 2.5}
                  filter="url(#dotGlow)"
                  className="transition-all duration-150"
                />

                {/* Week label on X-axis (angled when more than 10 weeks to prevent crowding) */}
                {weekData.length > 10 ? (
                  <g transform={`translate(${cx}, ${padTop + innerH + 16}) rotate(-35)`}>
                    <text
                      x={0}
                      y={0}
                      textAnchor="end"
                      className={`text-[11px] font-mono transition-colors ${
                        isHovered || isSelected
                          ? 'fill-blue-700 font-bold'
                          : isPeak
                          ? 'fill-amber-800 font-bold'
                          : 'fill-slate-600'
                      }`}
                    >
                      W{d.week}
                    </text>
                  </g>
                ) : (
                  <text
                    x={cx}
                    y={padTop + innerH + 18}
                    textAnchor="middle"
                    className={`text-[11px] font-mono transition-colors ${
                      isHovered || isSelected
                        ? 'fill-blue-700 font-bold'
                        : isPeak
                        ? 'fill-amber-800 font-bold'
                        : 'fill-slate-600'
                    }`}
                  >
                    W{d.week}
                  </text>
                )}

                {/* Highly legible angled value label - placed at -40° angle so texts never overlap across multiple weeks */}
                {(weekData.length <= 16 ||
                  isPeak ||
                  isHovered ||
                  isSelected ||
                  i % 2 === 0 ||
                  i === weekData.length - 1) && (
                  <g
                    transform={`translate(${cx + 4}, ${
                      cy < padTop + 24 ? cy + 14 : cy - 8
                    }) rotate(${cy < padTop + 24 ? 35 : -40})`}
                  >
                    <text
                      x={0}
                      y={0}
                      textAnchor="start"
                      className={`text-[10px] sm:text-[11px] font-mono font-bold select-none ${
                        isPeak
                          ? 'fill-amber-800 font-extrabold'
                          : isHovered || isSelected
                          ? 'fill-blue-700 font-extrabold'
                          : 'fill-slate-800'
                      }`}
                      style={{
                        paintOrder: 'stroke fill',
                        stroke: '#ffffff',
                        strokeWidth: isPeak || isHovered ? '3.5px' : '3px',
                        strokeLinejoin: 'round',
                      }}
                    >
                      {isPeak ? '★ ' : ''}
                      {metric === 'duration'
                        ? `${Math.round(d.minutes).toLocaleString('es-MX')} min`
                        : `${d.eventCount} paros`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Bottom X-Axis Baseline */}
          <line
            x1={padLeft}
            y1={padTop + innerH}
            x2={svgWidth - padRight}
            y2={padTop + innerH}
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />

          {/* Bottom X-Axis Title - Generously separated from category labels */}
          <text
            x={padLeft + innerW / 2}
            y={svgHeight - 16}
            textAnchor="middle"
            className="fill-slate-600 text-[11px] font-bold tracking-wider uppercase select-none"
          >
            Semanas de Producción del Año (Calendario ISO 8601)
          </text>
        </svg>

        {/* Floating Tooltip Card */}
        {activePoint && hoveredIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-xs border border-slate-700/60 transition-all duration-75"
            style={{
              left: `${Math.min(
                Math.max(12, (getX(hoveredIndex) / svgWidth) * 100),
                84
              )}%`,
              top: `${Math.max(10, (getY(activePoint.value) / svgHeight) * 100 - 32)}%`,
              transform: 'translate(-50%, -100%)',
              minWidth: '190px',
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Semana {activePoint.week} (W{activePoint.week})
              </span>
              {summary.peakWeek?.week === activePoint.week && (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                  Pico
                </span>
              )}
            </div>

            <div className="space-y-1 pt-0.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-[11px]">Tiempo Muerto:</span>
                <span className="font-mono font-bold text-white text-xs">
                  {timeUnit === 'minutes'
                    ? `${Math.round(activePoint.minutes).toLocaleString('es-MX')} min`
                    : formatHoursDecimal(activePoint.minutes)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300 text-[11px]">
                <span>Equivalente:</span>
                <span className="font-mono text-slate-400">
                  {timeUnit === 'minutes'
                    ? formatHoursDecimal(activePoint.minutes)
                    : `${Math.round(activePoint.minutes).toLocaleString('es-MX')} min`}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300 text-[11px]">
                <span>Paros Registrados:</span>
                <span className="font-mono text-blue-300 font-semibold">
                  {activePoint.eventCount} eventos
                </span>
              </div>

              {activePoint.deltaPercentage !== null && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-400">Vs semana previa:</span>
                  <span
                    className={`font-mono font-bold flex items-center gap-0.5 ${
                      activePoint.deltaPercentage > 0
                        ? 'text-rose-400'
                        : activePoint.deltaPercentage < 0
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {activePoint.deltaPercentage > 0 ? '+' : ''}
                    {activePoint.deltaPercentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <div className="pt-1 text-[9px] text-slate-400 text-center italic border-t border-slate-800">
              Haz click para auditar y filtrar esta semana
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-1 bg-blue-600 rounded-full" />
            <span className="font-medium text-slate-700">Tiempo Muerto Total Semanal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-0.5 bg-slate-500 border-t border-dashed border-slate-500" />
            <span>Promedio del Periodo ({formatValWithUnit(summary.avgValue)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Semana Crítica Pico</span>
          </div>
        </div>

        <div className="text-slate-400 italic text-[10px]">
          Permite observar la evolución temporal, picos de falla y efectividad de contramedidas.
        </div>
      </div>
    </div>
  );
};
