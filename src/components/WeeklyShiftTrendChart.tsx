import React, { useState, useMemo, useRef } from 'react';
import { DowntimeRecord, ParetoMetric, TimeUnit } from '../types/downtime';
import { formatHoursDecimal, formatDuration } from '../utils/dateUtils';
import { ExportPngButton } from './ExportPngButton';
import { exportTo1080pFullHdPng } from '../utils/exportToPng';
import {
  Sun,
  Sunset,
  Moon,
  TrendingUp,
  Layers,
  Calendar,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface WeeklyShiftTrendChartProps {
  records: DowntimeRecord[];
  metric: ParetoMetric;
  timeUnit: TimeUnit;
  selectedWeek?: number | null;
  onSelectWeek?: (weekNumber: number) => void;
  title?: string;
  subtitle?: string;
}

export type ShiftKey = 'matutino' | 'vespertino' | 'nocturno';

interface ShiftConfig {
  key: ShiftKey;
  label: string;
  shortLabel: string;
  icon: typeof Sun;
  color: string;
  strokeColor: string;
  fillColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

const SHIFT_CONFIGS: ShiftConfig[] = [
  {
    key: 'matutino',
    label: 'Turno 1',
    shortLabel: 'Turno 1',
    icon: Sun,
    color: '#f59e0b', // Amber-500
    strokeColor: '#d97706', // Amber-600
    fillColor: '#fef3c7', // Amber-100
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-200',
  },
  {
    key: 'vespertino',
    label: 'Turno 2',
    shortLabel: 'Turno 2',
    icon: Sunset,
    color: '#0284c7', // Sky-600
    strokeColor: '#0369a1', // Sky-700
    fillColor: '#e0f2fe', // Sky-100
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-800',
    borderColor: 'border-sky-200',
  },
  {
    key: 'nocturno',
    label: 'Turno 3',
    shortLabel: 'Turno 3',
    icon: Moon,
    color: '#7c3aed', // Violet-600
    strokeColor: '#6d28d9', // Violet-700
    fillColor: '#ede9fe', // Violet-100
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-200',
  },
];

/**
 * Classify record shift into one of the 3 canonical shifts (1, 2, 3)
 */
export function classifyShift(shiftStr: string | number): ShiftKey | 'otro' {
  const s = String(shiftStr ?? '').toLowerCase().trim();
  if (
    s === '1' ||
    s === 'turno 1' ||
    s === 't1' ||
    s.startsWith('1') ||
    s.includes('matutin') ||
    s.includes('mañana')
  ) {
    return 'matutino';
  }
  if (
    s === '2' ||
    s === 'turno 2' ||
    s === 't2' ||
    s.startsWith('2') ||
    s.includes('vespertin') ||
    s.includes('tarde')
  ) {
    return 'vespertino';
  }
  if (
    s === '3' ||
    s === 'turno 3' ||
    s === 't3' ||
    s.startsWith('3') ||
    s.includes('nocturn') ||
    s.includes('noche')
  ) {
    return 'nocturno';
  }
  return 'otro';
}

export interface WeekShiftDataPoint {
  week: number;
  label: string;
  shifts: {
    matutino: { minutes: number; hours: number; count: number; value: number };
    vespertino: { minutes: number; hours: number; count: number; value: number };
    nocturno: { minutes: number; hours: number; count: number; value: number };
  };
  totalMinutes: number;
  totalEvents: number;
  totalValue: number;
}

export const WeeklyShiftTrendChart: React.FC<WeeklyShiftTrendChartProps> = ({
  records,
  metric,
  timeUnit,
  selectedWeek,
  onSelectWeek,
  title = 'Tendencia Semanal por Turno (Turno 1, Turno 2 y Turno 3)',
  subtitle = 'Comportamiento simultáneo de los turnos 1, 2 y 3 para identificar desfases y turnos críticos',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Active shift visibility filters (all visible by default)
  const [visibleShifts, setVisibleShifts] = useState<Record<ShiftKey, boolean>>({
    matutino: true,
    vespertino: true,
    nocturno: true,
  });

  const toggleShift = (shiftKey: ShiftKey) => {
    setVisibleShifts((prev) => {
      // Don't allow unselecting all 3
      const next = { ...prev, [shiftKey]: !prev[shiftKey] };
      const hasAnyVisible = Object.values(next).some(Boolean);
      if (!hasAnyVisible) return prev;
      return next;
    });
  };

  // Group records by week and by the 3 shifts
  const weekData = useMemo<WeekShiftDataPoint[]>(() => {
    if (records.length === 0) return [];

    let minW = Infinity;
    let maxW = -Infinity;

    // Intermediate aggregation map: week -> shift -> { minutes, count }
    const map = new Map<
      number,
      Record<ShiftKey, { minutes: number; count: number }>
    >();

    records.forEach((r) => {
      const w = r.weekOfYear;
      if (w !== undefined && w !== null && !isNaN(w)) {
        minW = Math.min(minW, w);
        maxW = Math.max(maxW, w);

        const cur = map.get(w) || {
          matutino: { minutes: 0, count: 0 },
          vespertino: { minutes: 0, count: 0 },
          nocturno: { minutes: 0, count: 0 },
        };

        const shiftKey = classifyShift(r.shift);
        if (shiftKey !== 'otro') {
          cur[shiftKey].minutes += r.durationMinutes;
          cur[shiftKey].count += 1;
        }

        map.set(w, cur);
      }
    });

    if (minW === Infinity) return [];

    const points: WeekShiftDataPoint[] = [];

    for (let w = minW; w <= maxW; w++) {
      const data = map.get(w) || {
        matutino: { minutes: 0, count: 0 },
        vespertino: { minutes: 0, count: 0 },
        nocturno: { minutes: 0, count: 0 },
      };

      const calcValue = (minutes: number, count: number) => {
        if (metric === 'duration') {
          return timeUnit === 'minutes' ? minutes : minutes / 60;
        }
        return count;
      };

      const matVal = calcValue(data.matutino.minutes, data.matutino.count);
      const vesVal = calcValue(data.vespertino.minutes, data.vespertino.count);
      const nocVal = calcValue(data.nocturno.minutes, data.nocturno.count);

      const totalMinutes =
        data.matutino.minutes + data.vespertino.minutes + data.nocturno.minutes;
      const totalEvents =
        data.matutino.count + data.vespertino.count + data.nocturno.count;
      const totalValue = matVal + vesVal + nocVal;

      points.push({
        week: w,
        label: `Semana ${w}`,
        shifts: {
          matutino: {
            minutes: data.matutino.minutes,
            hours: data.matutino.minutes / 60,
            count: data.matutino.count,
            value: matVal,
          },
          vespertino: {
            minutes: data.vespertino.minutes,
            hours: data.vespertino.minutes / 60,
            count: data.vespertino.count,
            value: vesVal,
          },
          nocturno: {
            minutes: data.nocturno.minutes,
            hours: data.nocturno.minutes / 60,
            count: data.nocturno.count,
            value: nocVal,
          },
        },
        totalMinutes,
        totalEvents,
        totalValue,
      });
    }

    return points;
  }, [records, metric, timeUnit]);

  // Overall totals per shift for cards and legend
  const shiftTotals = useMemo(() => {
    const res: Record<
      ShiftKey,
      { minutes: number; hours: number; events: number; totalValue: number; peakWeek: number; peakVal: number }
    > = {
      matutino: { minutes: 0, hours: 0, events: 0, totalValue: 0, peakWeek: 0, peakVal: 0 },
      vespertino: { minutes: 0, hours: 0, events: 0, totalValue: 0, peakWeek: 0, peakVal: 0 },
      nocturno: { minutes: 0, hours: 0, events: 0, totalValue: 0, peakWeek: 0, peakVal: 0 },
    };

    weekData.forEach((p) => {
      (['matutino', 'vespertino', 'nocturno'] as ShiftKey[]).forEach((k) => {
        const item = p.shifts[k];
        res[k].minutes += item.minutes;
        res[k].hours += item.hours;
        res[k].events += item.count;
        res[k].totalValue += item.value;

        if (item.value > res[k].peakVal) {
          res[k].peakVal = item.value;
          res[k].peakWeek = p.week;
        }
      });
    });

    const grandTotalVal =
      res.matutino.totalValue + res.vespertino.totalValue + res.nocturno.totalValue || 1;

    return {
      matutino: {
        ...res.matutino,
        percentage: (res.matutino.totalValue / grandTotalVal) * 100,
        avgWeekly: weekData.length > 0 ? res.matutino.totalValue / weekData.length : 0,
      },
      vespertino: {
        ...res.vespertino,
        percentage: (res.vespertino.totalValue / grandTotalVal) * 100,
        avgWeekly: weekData.length > 0 ? res.vespertino.totalValue / weekData.length : 0,
      },
      nocturno: {
        ...res.nocturno,
        percentage: (res.nocturno.totalValue / grandTotalVal) * 100,
        avgWeekly: weekData.length > 0 ? res.nocturno.totalValue / weekData.length : 0,
      },
      grandTotalVal,
    };
  }, [weekData]);

  if (weekData.length === 0) {
    return null;
  }

  // Determine highest shift value across all weeks for Y-axis scale
  let maxShiftValue = 1;
  weekData.forEach((p) => {
    (['matutino', 'vespertino', 'nocturno'] as ShiftKey[]).forEach((k) => {
      if (visibleShifts[k]) {
        maxShiftValue = Math.max(maxShiftValue, p.shifts[k].value);
      }
    });
  });

  const yMax = maxShiftValue * 1.25; // 25% headroom for angled ticks & labels

  // Geometry - calibrated with clear category separation
  const svgWidth = 920;
  const svgHeight = 340;
  const padLeft = 68;
  const padRight = 62;
  const padTop = 46;
  const padBottom = 76;

  const innerW = svgWidth - padLeft - padRight;
  const innerH = svgHeight - padTop - padBottom;

  const getX = (index: number) => {
    if (weekData.length === 1) return padLeft + innerW / 2;
    return padLeft + (index / (weekData.length - 1)) * innerW;
  };

  const getY = (val: number) => {
    return padTop + innerH - (val / yMax) * innerH;
  };

  const formatValWithUnit = (val: number) => {
    if (metric === 'duration') {
      return timeUnit === 'minutes'
        ? `${Math.round(val).toLocaleString('es-MX')} min`
        : `${val.toFixed(1)} h`;
    }
    return `${Math.round(val)} paros`;
  };

  const yTicks = [0, yMax * 0.33, yMax * 0.66, yMax];

  // Active point for tooltip
  const activePoint = hoveredIndex !== null ? weekData[hoveredIndex] : null;

  const handleExport1080 = async () => {
    const metricLabel =
      metric === 'duration'
        ? timeUnit === 'minutes'
          ? 'Minutos'
          : 'Horas'
        : 'Número de Paros';

    await exportTo1080pFullHdPng({
      filename: `grafica_tendencia_3_turnos_1080p_full_hd.png`,
      title: title || 'Tendencia Semanal por Turno de Trabajo',
      subtitle: `${subtitle} · ${weekData.length} Semanas Monitoreadas · Unidad: ${metricLabel}`,
      legendItems: [
        {
          label: 'Turno 1 (06:00 - 14:00)',
          color: '#f59e0b',
          type: 'line',
          badge: `${shiftTotals.matutino.percentage.toFixed(0)}%`,
        },
        {
          label: 'Turno 2 (14:00 - 22:00)',
          color: '#2563eb',
          type: 'line',
          badge: `${shiftTotals.vespertino.percentage.toFixed(0)}%`,
        },
        {
          label: 'Turno 3 (22:00 - 06:00)',
          color: '#8b5cf6',
          type: 'line',
          badge: `${shiftTotals.nocturno.percentage.toFixed(0)}%`,
        },
      ],
      kpis: [
        {
          label: 'Turno 1',
          value: formatValWithUnit(shiftTotals.matutino.minutes),
          color: '#d97706',
        },
        {
          label: 'Turno 2',
          value: formatValWithUnit(shiftTotals.vespertino.minutes),
          color: '#1d4ed8',
        },
        {
          label: 'Turno 3',
          value: formatValWithUnit(shiftTotals.nocturno.minutes),
          color: '#7c3aed',
        },
      ],
      svgElement: svgRef.current,
      element: cardRef.current,
      footerNote: 'Sistema de Control de Tiempo Muerto · Comparativa Cronológica de los 3 Turnos (1, 2 y 3) para Presentación',
    });
  };

  return (
    <div ref={cardRef} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header and Shift Toggle Controls */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-3 border-b border-slate-100">
        {/* Esquina superior izquierda: Título, Subtítulo y Leyenda de Turnos */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
              <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                3 turnos (1, 2, 3)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>

          {/* Leyenda en la esquina superior izquierda */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-slate-800 font-semibold">Turno 1</span>
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200/80">
                {shiftTotals.matutino.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              <span className="text-slate-800 font-semibold">Turno 2</span>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded border border-blue-200/80">
                {shiftTotals.vespertino.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
              <span className="text-slate-800 font-semibold">Turno 3</span>
              <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200/80">
                {shiftTotals.nocturno.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Shift Visibility Toggles and Export Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-start">
          {SHIFT_CONFIGS.map((conf) => {
            const isVisible = visibleShifts[conf.key];
            const totals = shiftTotals[conf.key];
            const Icon = conf.icon;

            return (
              <button
                key={conf.key}
                type="button"
                onClick={() => toggleShift(conf.key)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  isVisible
                    ? `${conf.badgeBg} ${conf.badgeText} ${conf.borderColor} ring-1 ring-${conf.borderColor}`
                    : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 hover:opacity-80'
                }`}
                title={`Haz clic para ${isVisible ? 'ocultar' : 'mostrar'} la curva del ${conf.label}`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isVisible ? conf.color : '#94a3b8' }}
                />
                <Icon className="w-3.5 h-3.5" />
                <span>{conf.shortLabel}</span>
                {isVisible ? (
                  <Eye className="w-3 h-3 opacity-60 ml-0.5" />
                ) : (
                  <EyeOff className="w-3 h-3 opacity-60 ml-0.5" />
                )}
              </button>
            );
          })}

          {/* Export PNG Button */}
          <ExportPngButton
            targetRef={cardRef}
            onCustomExport={handleExport1080}
            filename={`grafica_tendencia_3_turnos_1080p_full_hd.png`}
            label="Descargar PNG (1080p Full HD)"
            tooltip="Guardar gráfica completa de los 3 turnos en alta resolución 1080p Full HD (1920x1080) con etiquetas legibles para diapositivas"
          />
        </div>
      </div>

      {/* KPI Cards for the 3 Shifts Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SHIFT_CONFIGS.map((conf) => {
          const data = shiftTotals[conf.key];
          const isVisible = visibleShifts[conf.key];
          const Icon = conf.icon;

          return (
            <div
              key={conf.key}
              onClick={() => toggleShift(conf.key)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isVisible
                  ? `${conf.badgeBg}/60 ${conf.borderColor} shadow-2xs`
                  : 'bg-slate-50/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: conf.color }}
                  />
                  <span>{conf.label}</span>
                </div>
                <div className="font-mono text-base font-bold text-slate-900">
                  {timeUnit === 'minutes'
                    ? `${Math.round(data.minutes).toLocaleString('es-MX')} min`
                    : formatHoursDecimal(data.minutes)}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {data.events} paros · Promedio: {formatValWithUnit(data.avgWeekly)}/sem
                </div>
              </div>

              <div className="text-right">
                <span
                  className="font-mono text-xs font-bold px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: conf.fillColor,
                    color: conf.strokeColor,
                  }}
                >
                  {data.percentage.toFixed(1)}%
                </span>
                <div className="text-[10px] text-slate-400 mt-1">del tiempo total</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SVG Multi-Line Chart Container */}
      <div className="relative w-full">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 sm:h-72 select-none overflow-visible"
        >
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

          {/* Hover Crosshair Vertical Guide */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={padTop}
              x2={getX(hoveredIndex)}
              y2={padTop + innerH}
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          )}

          {/* Render the 3 Shift Lines */}
          {SHIFT_CONFIGS.map((conf) => {
            if (!visibleShifts[conf.key]) return null;

            const points = weekData.map(
              (d, i) => `${getX(i)},${getY(d.shifts[conf.key].value)}`
            );
            const linePath = `M ${points.join(' L ')}`;

            return (
              <g key={conf.key}>
                {/* Line stroke */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={conf.color}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-200"
                />

                {/* Dots and clean non-colliding labels along this shift's line */}
                {weekData.map((d, i) => {
                  const cx = getX(i);
                  const cy = getY(d.shifts[conf.key].value);
                  const isHovered = hoveredIndex === i;
                  const isShiftPeak = d.week === shiftTotals[conf.key].peakWeek && shiftTotals[conf.key].peakVal > 0;

                  // Determine vertical rank among visible shifts at week i to prevent text collision
                  const shiftsAtWeek = SHIFT_CONFIGS
                    .filter((c) => visibleShifts[c.key])
                    .map((c) => ({ key: c.key, val: d.shifts[c.key].value }))
                    .sort((a, b) => b.val - a.val);

                  const isHighest = shiftsAtWeek[0]?.key === conf.key;
                  const isLowest = shiftsAtWeek[shiftsAtWeek.length - 1]?.key === conf.key && shiftsAtWeek.length > 1;

                  // Show label if peak of this shift, or on hover, or if selected week, or if prominent shift points when multiple weeks are selected
                  const isSelectedWeek = selectedWeek === d.week;
                  const showLabel =
                    isShiftPeak ||
                    isHovered ||
                    isSelectedWeek ||
                    (weekData.length <= 12 && (isHighest || isLowest)) ||
                    (weekData.length <= 6);

                  const isDownward = isLowest && !isShiftPeak && shiftsAtWeek.length > 1;
                  const rotateAngle = isDownward ? 35 : -40;
                  const labelY = isDownward ? cy + 12 : (cy < padTop + 24 ? cy + 14 : cy - 8);
                  const effectiveAngle = cy < padTop + 24 && !isDownward ? 35 : rotateAngle;

                  return (
                    <g key={i}>
                      {isHovered && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={7}
                          fill={conf.color}
                          fillOpacity="0.25"
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 6 : isShiftPeak ? 4.5 : 3.5}
                        fill={isShiftPeak ? conf.color : '#ffffff'}
                        stroke={conf.strokeColor}
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-150"
                      />

                      {/* Legible data label on point placed at angle */}
                      {showLabel && (
                        <g transform={`translate(${cx + 4}, ${labelY}) rotate(${effectiveAngle})`}>
                          <text
                            x={0}
                            y={0}
                            textAnchor="start"
                            className="text-[9.5px] font-mono font-bold select-none"
                            style={{
                              fill: conf.strokeColor,
                              paintOrder: 'stroke fill',
                              stroke: '#ffffff',
                              strokeWidth: isShiftPeak ? '3.5px' : '2.5px',
                              strokeLinejoin: 'round',
                            }}
                          >
                            {isShiftPeak ? `★ ` : ''}
                            {metric === 'duration'
                              ? `${Math.round(d.shifts[conf.key].minutes).toLocaleString('es-MX')} min`
                              : `${d.shifts[conf.key].count} paros`}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* X-axis week labels and interactive column triggers */}
          {weekData.map((d, i) => {
            const cx = getX(i);
            const isHovered = hoveredIndex === i;
            const isSelected = selectedWeek === d.week;

            return (
              <g
                key={d.week}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectWeek && onSelectWeek(d.week)}
              >
                {/* Wide invisible hit area */}
                <rect
                  x={cx - 18}
                  y={padTop}
                  width={36}
                  height={innerH + padBottom}
                  fill="transparent"
                />

                {/* X-axis Week label (angled when more than 10 weeks to prevent crowding) */}
                {weekData.length > 10 ? (
                  <g transform={`translate(${cx}, ${padTop + innerH + 16}) rotate(-35)`}>
                    <text
                      x={0}
                      y={0}
                      textAnchor="end"
                      className={`text-[11px] font-mono transition-colors ${
                        isHovered || isSelected
                          ? 'fill-indigo-700 font-bold'
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
                        ? 'fill-indigo-700 font-bold'
                        : 'fill-slate-600'
                    }`}
                  >
                    W{d.week}
                  </text>
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
            Semanas de Producción del Año (Monitoreo de Turnos 1, 2 y 3)
          </text>
        </svg>

        {/* Synchronized Multi-Shift Tooltip Card */}
        {activePoint && hoveredIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-2 backdrop-blur-xs border border-slate-700/60 transition-all duration-75"
            style={{
              left: `${Math.min(
                Math.max(16, (getX(hoveredIndex) / svgWidth) * 100),
                82
              )}%`,
              top: '8%',
              transform: 'translate(-50%, 0)',
              minWidth: '240px',
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Semana {activePoint.week} (W{activePoint.week})
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-300">
                Total: {formatValWithUnit(activePoint.totalValue)}
              </span>
            </div>

            {/* Shift-by-shift breakdown rows */}
            <div className="space-y-1.5">
              {SHIFT_CONFIGS.map((conf) => {
                const shiftData = activePoint.shifts[conf.key];
                const shiftPct =
                  activePoint.totalValue > 0
                    ? (shiftData.value / activePoint.totalValue) * 100
                    : 0;

                return (
                  <div
                    key={conf.key}
                    className={`flex items-center justify-between py-1 px-2 rounded-lg ${
                      visibleShifts[conf.key] ? 'bg-slate-800/60' : 'opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: conf.color }}
                      />
                      <span className="text-[11px] font-semibold text-slate-200">
                        {conf.label}:
                      </span>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">
                        {timeUnit === 'minutes'
                          ? `${Math.round(shiftData.minutes)} min`
                          : formatHoursDecimal(shiftData.minutes)}
                      </span>
                      <span
                        className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded"
                        style={{
                          backgroundColor: `${conf.color}33`,
                          color: conf.color,
                        }}
                      >
                        {shiftPct.toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({shiftData.count}p)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-1.5 text-[9px] text-slate-400 text-center italic border-t border-slate-800">
              Haz click en la columna para filtrar esta semana en la tabla
            </div>
          </div>
        )}
      </div>

      {/* Footer Industrial Legend & Operational Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-4 flex-wrap">
          {SHIFT_CONFIGS.map((conf) => (
            <div key={conf.key} className="flex items-center gap-1.5">
              <div
                className="w-3.5 h-1 rounded-full"
                style={{ backgroundColor: conf.color }}
              />
              <span className="font-medium text-slate-700">{conf.label}</span>
            </div>
          ))}
        </div>

        <div className="text-slate-400 italic text-[10px] flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          Haz clic en cualquier turno arriba para ocultarlo o aislar su curva.
        </div>
      </div>
    </div>
  );
};
