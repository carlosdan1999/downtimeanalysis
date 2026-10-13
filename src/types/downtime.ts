export type ProblemCategory = string;

export type ShiftType = string;

export interface ProblemDefinition {
  name: string;
  category: string;
}

export interface MasterCatalogs {
  lines: string[];
  machines: string[];
  problems: ProblemDefinition[];
  categories: string[];
  shifts: string[];
}

export interface DowntimeRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weekOfYear: number; // 1-52
  productionLine: string;
  machine: string; // Máquina / Equipo
  problem: string;
  category: ProblemCategory;
  durationMinutes: number;
  shift: ShiftType;
  rootCauseNotes: string;
  actionTaken: string;
}

export type ParetoMetric = 'duration' | 'frequency';

export type TimeUnit = 'minutes' | 'hours';

export type TimeGranularity = 'day' | 'week' | 'month';

export interface AppSettings {
  timeUnit: TimeUnit;
  timeGranularity: TimeGranularity;
}

export interface ParetoItem {
  key: string;
  label: string;
  value: number; // Total minutes or count
  count: number;
  percentage: number; // Individual % (e.g. 28.4%)
  cumulativeValue: number;
  cumulativePercentage: number; // Cumulative % (e.g. 68.2%)
  isVitalFew: boolean; // Under or at 80%
  category?: ProblemCategory;
}

export interface ParetoAnalysisResult {
  items: ParetoItem[];
  totalValue: number;
  totalCount: number;
  vitalFewCount: number;
  vitalFewPercentage: number; // What % of categories account for 80%
  vitalFewValueShare: number; // Exactly what % of total downtime is in the vital few
}

export interface FilterState {
  search: string;
  line: string;
  machine: string;
  category: string;
  shift: string;
  startWeek: number;
  endWeek: number;
}
