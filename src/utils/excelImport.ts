import * as XLSX from 'xlsx';
import { DowntimeRecord, MasterCatalogs } from '../types/downtime';
import { getISOWeekNumber } from './dateUtils';

interface ParseExcelResult {
  records: DowntimeRecord[];
  newLines: string[];
  newMachines: string[];
  newProblems: { name: string; category: string }[];
  newCategories: string[];
  newShifts: string[];
  totalRowsFound: number;
}

/**
 * Normalizes header string: strips accents, lowercases, removes non-alphanumeric chars
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Formats date into YYYY-MM-DD
 */
function parseDateCell(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];

  // If already Date object from SheetJS cellDates
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  const str = String(val).trim();

  // Try matching YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Try matching DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try standard Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Normalize raw shift input from Excel (recognizes 1, 2, 3, Turno 1, T1, Matutino, etc.)
 */
export function normalizeShift(raw: any): string {
  if (raw === undefined || raw === null) return '1';
  const s = String(raw).trim();
  const lower = s.toLowerCase();
  if (
    lower === '1' ||
    lower === 'turno 1' ||
    lower === 't1' ||
    lower.startsWith('1') ||
    lower.includes('matutin') ||
    lower.includes('mañana')
  ) {
    return '1';
  }
  if (
    lower === '2' ||
    lower === 'turno 2' ||
    lower === 't2' ||
    lower.startsWith('2') ||
    lower.includes('vespertin') ||
    lower.includes('tarde')
  ) {
    return '2';
  }
  if (
    lower === '3' ||
    lower === 'turno 3' ||
    lower === 't3' ||
    lower.startsWith('3') ||
    lower.includes('nocturn') ||
    lower.includes('noche')
  ) {
    return '3';
  }
  return s || '1';
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file into DowntimeRecords
 */
export async function parseExcelFile(file: File): Promise<ParseExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('El archivo de Excel no contiene hojas de cálculo.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
  });

  if (rawRows.length === 0) {
    throw new Error('La hoja de cálculo está vacía.');
  }

  // Header detection
  const firstRow = rawRows[0];
  const headerKeys = Object.keys(firstRow);

  const getColVal = (row: Record<string, any>, possibleNames: string[]): any => {
    for (const key of headerKeys) {
      const normKey = normalizeHeader(key);
      for (const target of possibleNames) {
        if (normKey === target || normKey.includes(target)) {
          const val = row[key];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return val;
          }
        }
      }
    }
    return '';
  };

  const parsedRecords: DowntimeRecord[] = [];
  const discoveredLines = new Set<string>();
  const discoveredMachines = new Set<string>();
  const discoveredProblems = new Map<string, string>();
  const discoveredCategories = new Set<string>();
  const discoveredShifts = new Set<string>();

  rawRows.forEach((row, idx) => {
    const dateVal = getColVal(row, ['fecha', 'date', 'dia']);
    const lineVal = getColVal(row, ['linea', 'lineade', 'line']);
    const machineVal = getColVal(row, ['maquina', 'equipo', 'machine', 'aparato', 'estacion']);
    const problemVal = getColVal(row, ['problema', 'falla', 'motivo', 'defecto', 'descripcion', 'paro']);
    const catVal = getColVal(row, ['categoria', 'tipo', 'clasificacion', 'category']);
    const durVal = getColVal(row, ['minutos', 'duracion', 'duracionmin', 'tiempo', 'min', 'duration']);
    const weekVal = getColVal(row, ['semana', 'week', 'sem', 'semanaano']);
    const shiftVal = getColVal(row, ['turno', 'shift', 'jornada']);
    const notesVal = getColVal(row, ['causaraiz', 'notas', 'observaciones', 'rootcause', 'detalle']);
    const actionVal = getColVal(row, ['accion', 'acciontomada', 'correctiva', 'solucion']);

    // If completely empty row, ignore
    if (!lineVal && !problemVal && !durVal && !machineVal) return;

    const date = parseDateCell(dateVal);
    const line = String(lineVal || 'Línea 1').trim();
    const machine = String(machineVal || 'Máquina Principal').trim();
    const problem = String(problemVal || 'Paro No Especificado').trim();
    const category = String(catVal || 'Mecánico').trim();
    const duration = Math.max(1, Math.round(Number(String(durVal).replace(/[^0-9.]/g, '')) || 30));

    let week = Number(weekVal);
    if (!week || isNaN(week) || week < 1 || week > 53) {
      week = getISOWeekNumber(date);
    }

    const shift = normalizeShift(shiftVal);
    const rootCauseNotes = String(notesVal || '').trim();
    const actionTaken = String(actionVal || '').trim();

    const record: DowntimeRecord = {
      id: `EXC-W${week}-${idx + 1}`,
      date,
      weekOfYear: week,
      productionLine: line,
      machine,
      problem,
      category,
      durationMinutes: duration,
      shift,
      rootCauseNotes,
      actionTaken,
    };

    parsedRecords.push(record);

    if (line) discoveredLines.add(line);
    if (machine) discoveredMachines.add(machine);
    if (category) discoveredCategories.add(category);
    if (shift) discoveredShifts.add(shift);
    if (problem) {
      if (!discoveredProblems.has(problem)) {
        discoveredProblems.set(problem, category);
      }
    }
  });

  return {
    records: parsedRecords,
    newLines: Array.from(discoveredLines),
    newMachines: Array.from(discoveredMachines),
    newProblems: Array.from(discoveredProblems.entries()).map(([name, category]) => ({
      name,
      category,
    })),
    newCategories: Array.from(discoveredCategories),
    newShifts: Array.from(discoveredShifts),
    totalRowsFound: parsedRecords.length,
  };
}

/**
 * Exports current records to an Excel (.xlsx) file without costs/operator, with machine
 */
export function exportRecordsToExcel(
  records: DowntimeRecord[],
  catalogs?: MasterCatalogs,
  filename = 'downtime_pareto_datos.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Raw Records
  const formattedRows = records.map((r) => ({
    'ID Evento': r.id,
    'Fecha': r.date,
    'Semana del Año': r.weekOfYear,
    'Línea de Producción': r.productionLine,
    'Máquina / Equipo': r.machine,
    'Problema / Falla': r.problem,
    'Categoría Técnica': r.category,
    'Duración (Minutos)': r.durationMinutes,
    'Duración (Horas)': (r.durationMinutes / 60).toFixed(2),
    'Turno': r.shift,
    'Análisis Causa Raíz': r.rootCauseNotes,
    'Acción Correctiva': r.actionTaken,
  }));

  const wsRecords = XLSX.utils.json_to_sheet(formattedRows);

  wsRecords['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 15 },
    { wch: 28 },
    { wch: 30 },
    { wch: 32 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 35 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, wsRecords, 'Registro de Paros');

  // Sheet 2: Master Catalogs
  if (catalogs) {
    const catalogRows: any[] = [];
    const maxLen = Math.max(
      catalogs.lines.length,
      catalogs.machines.length,
      catalogs.categories.length,
      catalogs.shifts.length,
      catalogs.problems.length
    );

    for (let i = 0; i < maxLen; i++) {
      catalogRows.push({
        'Líneas': catalogs.lines[i] || '',
        'Máquinas / Equipos': catalogs.machines[i] || '',
        'Categorías Técnicas': catalogs.categories[i] || '',
        'Turnos de Trabajo': catalogs.shifts[i] || '',
        'Problema Registrado': catalogs.problems[i]?.name || '',
        'Categoría del Problema': catalogs.problems[i]?.category || '',
      });
    }

    const wsCatalogs = XLSX.utils.json_to_sheet(catalogRows);
    wsCatalogs['!cols'] = [
      { wch: 28 },
      { wch: 30 },
      { wch: 22 },
      { wch: 22 },
      { wch: 32 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, wsCatalogs, 'Catálogos Maestros');
  }

  XLSX.writeFile(wb, filename);
}

/**
 * Generates an empty / pre-populated Excel template ready for the user to fill and feed
 */
export function downloadExcelTemplate(catalogs?: MasterCatalogs) {
  const wb = XLSX.utils.book_new();

  // Example data
  const templateRows = [
    {
      'Fecha': '2026-10-12',
      'Semana': 41,
      'Línea de Producción': catalogs?.lines[0] || 'Línea 1 - Envasado Líquidos',
      'Máquina / Equipo': catalogs?.machines[0] || 'Llenadora Isométrica 32V',
      'Problema / Falla': catalogs?.problems[0]?.name || 'Atasco en banda transportadora',
      'Categoría': 'Mecánico',
      'Duración (Minutos)': 90,
      'Turno': '1',
      'Causa Raíz': 'Desgaste en guía de rodillos por fricción',
      'Acción Correctiva': 'Ajuste de tensión y reemplazo de rodillo',
    },
    {
      'Fecha': '2026-10-13',
      'Semana': 41,
      'Línea de Producción': catalogs?.lines[1] || 'Línea 2 - Empaque Secundario',
      'Máquina / Equipo': catalogs?.machines[2] || 'Encartonadora Automática Horizontal',
      'Problema / Falla': 'Falla en sensor fotoeléctrico',
      'Categoría': 'Eléctrico/Electrónico',
      'Duración (Minutos)': 45,
      'Turno': '2',
      'Causa Raíz': 'Acumulación de polvo en lente receptor',
      'Acción Correctiva': 'Limpieza y recalibración de sensibilidad',
    },
  ];

  const wsTemplate = XLSX.utils.json_to_sheet(templateRows);
  wsTemplate['!cols'] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 28 },
    { wch: 30 },
    { wch: 32 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 35 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Plantilla Carga Paros');

  // Sheet with Guide / Catalogs
  if (catalogs) {
    const guideRows = catalogs.lines.map((l, i) => ({
      'Líneas': l,
      'Máquinas': catalogs.machines[i] || '',
      'Categorías Sugeridas': catalogs.categories[i] || '',
      'Turnos Sugeridos': catalogs.shifts[i] || '',
    }));
    const wsGuide = XLSX.utils.json_to_sheet(guideRows);
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Referencia Catálogos');
  }

  XLSX.writeFile(wb, 'plantilla_alimentacion_downtime.xlsx');
}
