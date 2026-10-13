import React, { useState, useRef } from 'react';
import { ParetoItem, ParetoMetric, TimeUnit } from '../types/downtime';
import { formatHoursDecimal, formatDuration } from '../utils/dateUtils';
import { ExportPngButton } from './ExportPngButton';
import { exportTo1080pFullHdPng } from '../utils/exportToPng';

interface ParetoChartProps {
  items: ParetoItem[];
  metric: ParetoMetric;
  timeUnit?: TimeUnit;
  title?: string;
  onSelectBar?: (item: ParetoItem) => void;
  selectedKey?: string | null;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({
  items,
  metric,
  timeUnit = 'hours',
  title,
  onSelectBar,
  selectedKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredItem, setHoveredItem] = useState<{
    item: ParetoItem;
    x: number;
    y: number;
    barIndex: number;
  } | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
        <p className="text-sm font-medium text-slate-500">
          No hay datos disponibles para generar el diagrama de Pareto con los filtros actuales.
        </p>
      </div>
    );
  }

  // Chart dimensions & padding - optimized with dedicated space separating X category labels and X title
  const svgWidth = 980;
  const svgHeight = 525;
  const margin = { top: 50, right: 65, bottom: 148, left: 74 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  const xAxisTitle = title?.toLowerCase().includes('máquina')
    ? 'Equipos y Máquinas Monitoreadas'
    : title?.toLowerCase().includes('línea')
    ? 'Líneas de Producción'
    : title?.toLowerCase().includes('turno')
    ? 'Turnos de Trabajo'
    : title?.toLowerCase().includes('semana')
    ? 'Semanas de Producción'
    : title?.toLowerCase().includes('día')
    ? 'Días Monitoreados'
    : 'Categorías y Causas de Paro (Orden de Mayor a Menor)';

  // Max value for left Y-axis (scale max with 25% headroom so angled labels have ample ceiling)
  const maxValue = Math.max(...items.map((i) => i.value), 1);
  const leftYMax = Math.ceil(maxValue * 1.25);

  // Formatting helpers for Left Y-axis ticks
  const formatYValue = (val: number) => {
    if (metric === 'duration') {
      return timeUnit === 'minutes' ? `${Math.round(val).toLocaleString('es-MX')} min` : formatHoursDecimal(val);
    }
    if (metric === 'frequency') {
      return `${Math.round(val)} paros`;
    }
    return val.toString();
  };

  // Data label formatted strictly in real minutes (without percentages, per user request)
  const formatDataLabelValue = (val: number) => {
    if (metric === 'duration') {
      return `${Math.round(val).toLocaleString('es-MX')} min`;
    }
    return `${Math.round(val)} paros`;
  };

  // Bar sizing
  const numItems = items.length;
  const barGapRatio = 0.28;
  const slotWidth = plotWidth / numItems;
  const barWidth = Math.max(14, Math.min(68, slotWidth * (1 - barGapRatio)));
  const gap = slotWidth - barWidth;

  // Coordinate scales
  const getX = (index: number) => margin.left + index * slotWidth + gap / 2;
  const getBarHeight = (value: number) => (value / leftYMax) * plotHeight;
  const getYLeft = (value: number) => margin.top + (plotHeight - getBarHeight(value));

  // Cumulative percentage scale (0 to 100%)
  const getYRight = (pct: number) => margin.top + plotHeight - (pct / 100) * plotHeight;

  // 80% line Y position
  const y80 = getYRight(80);

  // Cumulative curve points
  const points = items.map((item, index) => {
    const x = getX(index) + barWidth / 2;
    const y = getYRight(item.cumulativePercentage);
    return { x, y, item, index };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Left Axis Ticks (5 intervals)
  const leftTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: leftYMax * pct,
    y: margin.top + plotHeight - pct * plotHeight,
  }));

  // Right Axis Ticks (0, 20, 40, 60, 80, 100%)
  const rightTicks = [0, 20, 40, 60, 80, 100].map((pct) => ({
    pct,
    y: getYRight(pct),
  }));

  const handleExport1080 = async () => {
    await exportTo1080pFullHdPng({
      filename: `grafica_pareto_${(title || 'analisis').toLowerCase().replace(/[^a-z0-9]/g, '_')}_1080p_full_hd.png`,
      title: title || 'Diagrama de Pareto 80/20 · Análisis de Causa Raíz',
      subtitle: `Ley 80/20 · Valores reales en minutos · Curva Acumulada · ${items.length} Elementos Auditados`,
      legendItems: [
        { label: 'Causas Vitales (80% impacto crítico)', color: '#2563eb', type: 'rect' },
        { label: 'Causas Secundarias', color: '#94a3b8', type: 'rect' },
        { label: 'Curva Acumulada', color: '#4f46e5', type: 'line' },
        { label: 'Límite 80%', color: '#f43f5e', type: 'dashed' },
      ],
      kpis: [
        { label: 'Pico Máximo', value: formatYValue(maxValue) },
        { label: 'Total Elementos', value: `${items.length}` },
      ],
      svgElement: svgRef.current,
      element: containerRef.current,
      footerNote: 'Sistema de Control de Tiempo Muerto · Planta Industrial · Análisis Pareto 80/20 para Presentación',
    });
  };

  return (
    <div ref={containerRef} className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      {/* Header with Title and Legend strictly in the upper-left corner */}
      <div className="flex flex-col md:flex-row md:items-start justify-between pb-4 border-b border-slate-100 gap-4">
        {/* Esquina superior izquierda: Título y Leyenda agrupados */}
        <div className="space-y-2">
          <div>
            {title && (
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                {title}
              </h3>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-medium text-slate-700">Ley 80/20</span>
              <span aria-hidden="true">·</span>
              <span>
                Eje Izq:{' '}
                {metric === 'duration'
                  ? timeUnit === 'minutes'
                    ? 'Tiempo Muerto (Minutos)'
                    : 'Tiempo Muerto (Horas)'
                  : 'Frecuencia (Número de Paros)'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Eje Der: % Acumulado</span>
            </div>
          </div>

          {/* Leyenda en la esquina superior izquierda */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block shadow-2xs"></span>
              <span className="text-slate-800">Causas Vitales (80% crítico)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-slate-300 inline-block"></span>
              <span className="text-slate-500">Causas Secundarias</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-indigo-600 inline-block"></span>
              <span className="text-indigo-800">Curva % Acumulado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500 inline-block"></span>
              <span className="text-rose-600 font-bold">Límite 80%</span>
            </div>
          </div>
        </div>

        {/* Acciones en la esquina superior derecha */}
        <div className="flex items-center gap-2 shrink-0 self-start">
          <ExportPngButton
            targetRef={containerRef}
            onCustomExport={handleExport1080}
            filename={`grafica_pareto_${(title || 'analisis').toLowerCase().replace(/[^a-z0-9]/g, '_')}_1080p_full_hd.png`}
            label="Descargar PNG (1080p Full HD)"
            tooltip="Guardar gráfica completa de Pareto en alta resolución 1080p Full HD (1920x1080) con título, leyenda y etiquetas legibles para diapositivas"
          />
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto mt-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[760px] h-auto select-none"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {/* Horizontal grid lines */}
          {leftTicks.map((t, i) => (
            <line
              key={i}
              x1={margin.left}
              y1={t.y}
              x2={svgWidth - margin.right}
              y2={t.y}
              stroke="#f1f5f9"
              strokeWidth="1.5"
            />
          ))}

          {/* Pareto 80% reference line */}
          <line
            x1={margin.left}
            y1={y80}
            x2={svgWidth - margin.right}
            y2={y80}
            stroke="#e11d48"
            strokeWidth="1.75"
            strokeDasharray="5 3"
          />
          <text
            x={svgWidth - margin.right - 8}
            y={y80 - 6}
            fill="#e11d48"
            fontSize="10"
            fontWeight="700"
            textAnchor="end"
          >
            Umbral 80% (Poco Vital)
          </text>

          {/* Left Y Axis (Values - scale ticks without Y-axis title per user request) */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.25"
          />
          {leftTicks.map((t, i) => (
            <g key={`ly-${i}`} transform={`translate(${margin.left - 10}, ${t.y + 4})`}>
              <text
                textAnchor="end"
                className="fill-slate-500 text-[10px] font-mono font-medium"
              >
                {formatYValue(t.val)}
              </text>
            </g>
          ))}

          {/* Right Y Axis (Percentages - scale ticks without Y-axis title per user request) */}
          <line
            x1={svgWidth - margin.right}
            y1={margin.top}
            x2={svgWidth - margin.right}
            y2={margin.top + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.25"
          />
          {rightTicks.map((t, i) => (
            <g
              key={`ry-${i}`}
              transform={`translate(${svgWidth - margin.right + 10}, ${t.y + 3})`}
            >
              <text
                textAnchor="start"
                className={`text-[10px] font-mono ${
                  t.pct === 80
                    ? 'fill-rose-600 font-bold'
                    : 'fill-slate-500 font-medium'
                }`}
              >
                {t.pct}%
              </text>
            </g>
          ))}

          {/* Bottom X Axis Baseline */}
          <line
            x1={margin.left}
            y1={margin.top + plotHeight}
            x2={svgWidth - margin.right}
            y2={margin.top + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.25"
          />

          {/* Bottom X Axis Title - Generously separated from category labels */}
          <text
            x={margin.left + plotWidth / 2}
            y={svgHeight - 16}
            textAnchor="middle"
            className="fill-slate-600 text-[11px] font-bold tracking-wider uppercase select-none"
          >
            {xAxisTitle}
          </text>

          {/* Bars */}
          {items.map((item, index) => {
            const x = getX(index);
            const y = getYLeft(item.value);
            const h = Math.max(2, getBarHeight(item.value));
            const isVital = item.isVitalFew;
            const isSelected = selectedKey === item.key;
            const p = points[index];
            const closeToCurve = Math.abs(y - p.y) < 26;
            const isBarTall = h >= 48;
            const maxChars = items.length > 14 ? 13 : items.length > 8 ? 18 : 24;

            return (
              <g
                key={`bar-${item.key}-${index}`}
                className="cursor-pointer transition-opacity group"
                onClick={() => onSelectBar && onSelectBar(item)}
                onMouseEnter={() => {
                  setHoveredItem({
                    item,
                    x: x + barWidth / 2,
                    y,
                    barIndex: index,
                  });
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx="3"
                  className={`transition-all duration-150 ${
                    isSelected
                      ? 'stroke-2 stroke-blue-700 fill-blue-700'
                      : isVital
                      ? 'fill-blue-600 hover:fill-blue-700'
                      : 'fill-slate-300 hover:fill-slate-400'
                  }`}
                />

                {/* Only real value in minutes - angled when bars are dense to eliminate collision */}
                {(() => {
                  const isNarrowBar = barWidth < 62 || items.length > 5;
                  if (closeToCurve && isBarTall) {
                    return (
                      <g
                        transform={`translate(${x + barWidth / 2 + (isNarrowBar ? 2 : 0)}, ${
                          y + 16
                        }) rotate(${isNarrowBar ? 35 : 0})`}
                      >
                        <text
                          x={0}
                          y={0}
                          textAnchor={isNarrowBar ? 'start' : 'middle'}
                          className="text-[10px] sm:text-[11px] font-mono fill-white font-extrabold select-none"
                          style={{
                            paintOrder: 'stroke fill',
                            stroke: 'rgba(15, 23, 42, 0.7)',
                            strokeWidth: '2.5px',
                            strokeLinejoin: 'round',
                          }}
                        >
                          {formatDataLabelValue(item.value)}
                        </text>
                      </g>
                    );
                  }

                  return (
                    <g
                      transform={`translate(${x + barWidth / 2 + (isNarrowBar ? 3 : 0)}, ${
                        y - 7
                      }) rotate(${isNarrowBar ? -45 : 0})`}
                    >
                      <text
                        x={0}
                        y={0}
                        textAnchor={isNarrowBar ? 'start' : 'middle'}
                        className="text-[10px] sm:text-[11px] font-mono fill-slate-900 font-extrabold select-none"
                        style={{
                          paintOrder: 'stroke fill',
                          stroke: '#ffffff',
                          strokeWidth: '3.5px',
                          strokeLinejoin: 'round',
                        }}
                      >
                        {formatDataLabelValue(item.value)}
                      </text>
                    </g>
                  );
                })()}

                {/* X Axis Category Label - rotated -38deg with textAnchor="end" */}
                <g
                  transform={`translate(${x + barWidth / 2}, ${
                    margin.top + plotHeight + 14
                  }) rotate(-38)`}
                >
                  <text
                    textAnchor="end"
                    className="text-[10px] sm:text-[11px] fill-slate-700 font-medium select-none"
                  >
                    {item.label.length > maxChars ? `${item.label.slice(0, maxChars - 1)}…` : item.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Cumulative Curve Polyline */}
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Cumulative Curve Points - Interactive dots only (no percentage text labels per user request) */}
          {points.map((p, i) => (
            <g
              key={`dot-${i}`}
              className="cursor-pointer"
              onMouseEnter={() =>
                setHoveredItem({
                  item: p.item,
                  x: p.x,
                  y: p.y,
                  barIndex: i,
                })
              }
              onMouseLeave={() => setHoveredItem(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredItem?.barIndex === i ? 6 : 4}
                fill="#ffffff"
                stroke="#4f46e5"
                strokeWidth="2.5"
                className="transition-all duration-150 shadow-sm"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Floating High-Tech Tooltip */}
      {hoveredItem && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900 text-white rounded-lg p-3.5 shadow-2xl border border-slate-700 text-xs transition-opacity duration-100 max-w-xs"
          style={{
            left: `${Math.min(
              svgWidth - 250,
              Math.max(20, (hoveredItem.x / svgWidth) * 100)
            )}%`,
            top: '50px',
          }}
        >
          <div className="font-bold text-white border-b border-slate-800 pb-1.5 mb-2">
            {hoveredItem.item.label}
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Tiempo total:</span>
              <span className="text-white font-bold">
                {timeUnit === 'minutes'
                  ? `${Math.round(hoveredItem.item.value).toLocaleString('es-MX')} min (${formatHoursDecimal(hoveredItem.item.value)})`
                  : `${formatHoursDecimal(hoveredItem.item.value)} (${Math.round(hoveredItem.item.value).toLocaleString('es-MX')} min)`}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Impacto individual:</span>
              <span className="text-cyan-400 font-bold">
                {hoveredItem.item.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Acumulado Pareto:</span>
              <span className="text-indigo-400 font-bold">
                {hoveredItem.item.cumulativePercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Eventos de paro:</span>
              <span className="text-slate-200">{hoveredItem.item.count} paradas</span>
            </div>
            <div className="pt-2 mt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Clasificación:</span>
              <span
                className={`font-bold ${
                  hoveredItem.item.isVitalFew ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {hoveredItem.item.isVitalFew
                  ? '⚡ Causa Vital (80% crítico)'
                  : 'Causa Secundaria'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
