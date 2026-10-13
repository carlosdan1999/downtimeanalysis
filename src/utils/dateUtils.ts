/**
 * Calculates the ISO-8601 week number for a given date string (YYYY-MM-DD)
 */
export function getISOWeekNumber(dateString: string): number {
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return 1;

  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export function formatMinutesToHours(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} h`;
  return `${hrs} h ${mins} min`;
}

export function formatHoursDecimal(minutes: number): string {
  return (minutes / 60).toFixed(1) + ' h';
}

export function formatDuration(minutes: number, unit: 'minutes' | 'hours' = 'hours'): string {
  if (unit === 'minutes') {
    return `${Math.round(minutes).toLocaleString('es-MX')} min`;
  }
  return formatHoursDecimal(minutes);
}

export function formatMonthLabel(yyyyMm: string): string {
  const parts = yyyyMm.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${months[monthNum - 1]} ${year}`;
    }
  }
  return yyyyMm;
}

export function formatDateLabel(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) {
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      return `${dayNames[d.getDay()]} ${day} ${monthNames[month - 1]}`;
    }
  }
  return yyyyMmDd;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
