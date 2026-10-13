import { DowntimeRecord, FilterState, ParetoAnalysisResult, ParetoItem, ParetoMetric } from '../types/downtime';
import { formatDateLabel, formatMonthLabel } from './dateUtils';

/**
 * Filter downtime records according to FilterState
 */
export function filterRecords(records: DowntimeRecord[], filters: FilterState): DowntimeRecord[] {
  return records.filter((rec) => {
    // Search text in problem, line, machine, notes
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const matchText =
        rec.problem.toLowerCase().includes(q) ||
        rec.productionLine.toLowerCase().includes(q) ||
        rec.machine.toLowerCase().includes(q) ||
        rec.category.toLowerCase().includes(q) ||
        rec.rootCauseNotes.toLowerCase().includes(q);
      if (!matchText) return false;
    }

    // Line filter
    if (filters.line && filters.line !== 'all' && rec.productionLine !== filters.line) {
      return false;
    }

    // Machine filter
    if (filters.machine && filters.machine !== 'all' && rec.machine !== filters.machine) {
      return false;
    }

    // Category filter
    if (filters.category && filters.category !== 'all' && rec.category !== filters.category) {
      return false;
    }

    // Shift filter (matches '1', '2', '3' and flexible representations)
    if (filters.shift && filters.shift !== 'all') {
      const match =
        rec.shift === filters.shift ||
        rec.shift.toLowerCase() === filters.shift.toLowerCase() ||
        (filters.shift === '1' && (rec.shift === '1' || rec.shift.includes('1') || rec.shift.toLowerCase().includes('matutin'))) ||
        (filters.shift === '2' && (rec.shift === '2' || rec.shift.includes('2') || rec.shift.toLowerCase().includes('vespertin'))) ||
        (filters.shift === '3' && (rec.shift === '3' || rec.shift.includes('3') || rec.shift.toLowerCase().includes('nocturn')));
      if (!match) return false;
    }

    // Week range
    if (rec.weekOfYear < filters.startWeek || rec.weekOfYear > filters.endWeek) {
      return false;
    }

    return true;
  });
}

export type GroupByTarget =
  | 'problem'
  | 'line'
  | 'week'
  | 'category'
  | 'machine'
  | 'day'
  | 'month';

/**
 * Compute Pareto Analysis based on group target and metric (duration or frequency)
 */
export function calculatePareto(
  records: DowntimeRecord[],
  groupBy: GroupByTarget,
  metric: ParetoMetric = 'duration'
): ParetoAnalysisResult {
  if (records.length === 0) {
    return {
      items: [],
      totalValue: 0,
      totalCount: 0,
      vitalFewCount: 0,
      vitalFewPercentage: 0,
      vitalFewValueShare: 0,
    };
  }

  // Aggregate map
  const aggMap = new Map<
    string,
    {
      label: string;
      minutes: number;
      count: number;
      category?: DowntimeRecord['category'];
    }
  >();

  for (const r of records) {
    let key = '';
    let label = '';

    if (groupBy === 'problem') {
      key = r.problem;
      label = r.problem;
    } else if (groupBy === 'line') {
      key = r.productionLine;
      label = r.productionLine;
    } else if (groupBy === 'machine') {
      key = r.machine;
      label = r.machine;
    } else if (groupBy === 'week') {
      key = `Semana ${r.weekOfYear}`;
      label = `Semana ${r.weekOfYear}`;
    } else if (groupBy === 'day') {
      key = r.date || 'Sin fecha';
      label = r.date ? formatDateLabel(r.date) : 'Sin fecha';
    } else if (groupBy === 'month') {
      const monthKey = r.date ? r.date.slice(0, 7) : 'Sin mes';
      key = monthKey;
      label = r.date ? formatMonthLabel(monthKey) : 'Sin mes';
    } else if (groupBy === 'category') {
      key = r.category;
      label = r.category;
    }

    const existing = aggMap.get(key);

    if (existing) {
      existing.minutes += r.durationMinutes;
      existing.count += 1;
    } else {
      aggMap.set(key, {
        label,
        minutes: r.durationMinutes,
        count: 1,
        category: r.category,
      });
    }
  }

  // Extract items
  const rawItems = Array.from(aggMap.entries()).map(([key, data]) => {
    let value = 0;
    if (metric === 'duration') value = data.minutes;
    else if (metric === 'frequency') value = data.count;

    return {
      key,
      label: data.label,
      value,
      count: data.count,
      minutes: data.minutes,
      category: data.category,
    };
  });

  // Sort descending by selected metric value
  rawItems.sort((a, b) => b.value - a.value);

  // Total sums
  const totalValue = rawItems.reduce((acc, curr) => acc + curr.value, 0);
  const totalCount = records.length;

  // Calculate percentages and cumulative curves
  let runningCumulative = 0;
  let vitalFewCount = 0;
  let vitalFewValueTotal = 0;

  const items: ParetoItem[] = rawItems.map((item, index) => {
    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    runningCumulative += item.value;
    const cumulativePercentage = totalValue > 0 ? (runningCumulative / totalValue) * 100 : 0;

    // Vital few: items up to and including the one that crosses 80% (or item where previous cumulative was < 80%)
    const prevCumulative = cumulativePercentage - percentage;
    const isVitalFew = prevCumulative < 80 || index === 0;

    if (isVitalFew) {
      vitalFewCount++;
      vitalFewValueTotal += item.value;
    }

    return {
      key: item.key,
      label: item.label,
      value: item.value,
      count: item.count,
      percentage,
      cumulativeValue: runningCumulative,
      cumulativePercentage: Math.min(100, cumulativePercentage),
      isVitalFew,
      category: item.category,
    };
  });

  const vitalFewPercentage = items.length > 0 ? (vitalFewCount / items.length) * 100 : 0;
  const vitalFewValueShare = totalValue > 0 ? (vitalFewValueTotal / totalValue) * 100 : 0;

  return {
    items,
    totalValue,
    totalCount,
    vitalFewCount,
    vitalFewPercentage,
    vitalFewValueShare,
  };
}

/**
 * Helper to compute simulation outcome when specified problems are resolved
 */
export function simulateParetoReduction(
  records: DowntimeRecord[],
  excludedProblems: Set<string>
) {
  const originalDuration = records.reduce((acc, r) => acc + r.durationMinutes, 0);

  const activeRecords = records.filter((r) => !excludedProblems.has(r.problem));
  const newDuration = activeRecords.reduce((acc, r) => acc + r.durationMinutes, 0);

  const savedMinutes = originalDuration - newDuration;
  const percentageReduced = originalDuration > 0 ? (savedMinutes / originalDuration) * 100 : 0;

  return {
    originalDuration,
    newDuration,
    savedMinutes,
    percentageReduced,
    remainingRecordsCount: activeRecords.length,
  };
}
