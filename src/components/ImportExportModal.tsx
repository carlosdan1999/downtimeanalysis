import React, { useRef, useState } from 'react';
import { DowntimeRecord, MasterCatalogs } from '../types/downtime';
import {
  parseExcelFile,
  exportRecordsToExcel,
  downloadExcelTemplate,
  normalizeShift,
} from '../utils/excelImport';
import {
  Download,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Layers,
  Image,
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DowntimeRecord[];
  catalogs: MasterCatalogs;
  onImportRecords: (
    newRecords: DowntimeRecord[],
    mode: 'append' | 'replace',
    newCatalogs?: MasterCatalogs
  ) => void;
  onResetDemoData: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  records,
  catalogs,
  onImportRecords,
  onResetDemoData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Staged import preview state
  const [stagedResult, setStagedResult] = useState<{
    records: DowntimeRecord[];
    newLines: string[];
    newMachines: string[];
    newProblems: { name: string; category: string }[];
    newCategories: string[];
    newShifts: string[];
    totalRows: number;
    filename: string;
  } | null>(null);

  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  if (!isOpen) return null;

  // Handle Excel/CSV file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setFeedbackMessage(null);
    setIsProcessing(true);

    try {
      const result = await parseExcelFile(file);
      if (result.records.length === 0) {
        setErrorMessage('No se encontraron filas con datos de paro en el archivo.');
        setIsProcessing(false);
        return;
      }

      setStagedResult({
        records: result.records,
        newLines: result.newLines,
        newMachines: result.newMachines,
        newProblems: result.newProblems,
        newCategories: result.newCategories,
        newShifts: result.newShifts,
        totalRows: result.totalRowsFound,
        filename: file.name,
      });

      setFeedbackMessage(
        `Archivo "${file.name}" leído correctamente. Se detectaron ${result.totalRowsFound} registros de paro.`
      );
    } catch (err: any) {
      console.error('Error importando archivo', err);
      setErrorMessage(
        err.message || 'Error al procesar el archivo. Asegúrate que sea un Excel (.xlsx, .xls) o CSV válido.'
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Confirm and integrate staged records
  const handleConfirmImport = () => {
    if (!stagedResult) return;

    // Merge discovered catalogs with current catalogs
    const mergedLines = Array.from(new Set([...catalogs.lines, ...stagedResult.newLines]));
    const mergedMachines = Array.from(new Set([...catalogs.machines, ...stagedResult.newMachines]));
    const mergedCategories = Array.from(
      new Set([...catalogs.categories, ...stagedResult.newCategories])
    );
    const mergedShifts = Array.from(
      new Set([...catalogs.shifts, ...stagedResult.newShifts].map((s) => normalizeShift(s)))
    );

    // Merge problems
    const existingProblemNames = new Set(catalogs.problems.map((p) => p.name.toLowerCase()));
    const additionalProblems = stagedResult.newProblems.filter(
      (p) => !existingProblemNames.has(p.name.toLowerCase())
    );
    const mergedProblems = [...catalogs.problems, ...additionalProblems];

    const updatedCatalogs: MasterCatalogs = {
      lines: mergedLines,
      machines: mergedMachines,
      categories: mergedCategories,
      shifts: mergedShifts,
      problems: mergedProblems,
    };

    onImportRecords(stagedResult.records, importMode, updatedCatalogs);

    setFeedbackMessage(
      `¡Se ${
        importMode === 'append' ? 'agregaron' : 'cargaron'
      } ${stagedResult.totalRows} registros a la base de datos!`
    );
    setStagedResult(null);
  };

  // Export full Excel
  const handleExportExcel = () => {
    exportRecordsToExcel(
      records,
      catalogs,
      `reporte_tiempo_muerto_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    setFeedbackMessage('Libro de Excel (.xlsx) exportado exitosamente con 2 hojas de datos.');
  };

  // Download template
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(catalogs);
    setFeedbackMessage('Plantilla de Excel descargada. Puedes completarla y subirla cuando gustes.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Alimentación de Base de Datos & Excel
              </h3>
              <p className="text-xs text-slate-500">
                Carga periódica de archivos de Excel (.xlsx, .xls) o exportación de reportes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">

        {/* Feedback Alerts */}
        {feedbackMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Staged Import Confirmation Panel */}
        {stagedResult && (
          <div className="mb-5 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-3">
            <div className="flex items-center justify-between font-semibold text-blue-900 text-sm">
              <span>Vista Previa de Carga: {stagedResult.filename}</span>
              <span className="font-mono bg-blue-100 px-2 py-0.5 rounded text-blue-800">
                {stagedResult.totalRows} registros listos
              </span>
            </div>

            <div className="text-slate-600">
              ¿Cómo deseas ingresar estos datos a la plataforma?
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 flex-1 hover:border-blue-400 transition-colors">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-semibold text-slate-800">
                    Alimentar / Agregar a los existentes
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Suma estos {stagedResult.totalRows} a los {records.length} actuales ({records.length + stagedResult.totalRows} total)
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 flex-1 hover:border-rose-400 transition-colors">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-semibold text-slate-800">
                    Reemplazar base completa
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Sobrescribe la base y deja solo los {stagedResult.totalRows} registros del archivo
                  </div>
                </div>
              </label>
            </div>

            {/* Preview of first 2 rows */}
            <div className="mt-2 bg-white rounded-lg p-2.5 border border-slate-200 overflow-x-auto text-[11px] font-mono">
              <div className="text-[10px] text-slate-400 font-sans uppercase font-bold mb-1">
                Muestra de registros procesados:
              </div>
              {stagedResult.records.slice(0, 2).map((r, i) => (
                <div key={i} className="text-slate-700 truncate">
                  • {r.date} | W{r.weekOfYear} | {r.productionLine} | {r.problem} ({r.durationMinutes}m) | {r.shift}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStagedResult(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium cursor-pointer"
              >
                Cancelar Carga
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold cursor-pointer shadow-xs"
              >
                Confirmar e Integrar a Paretos
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Section 1: Upload Excel */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Upload className="w-4 h-4 text-emerald-600" />
                Alimentar desde Archivo de Excel (.xlsx / .xls / .csv)
              </h4>
            </div>
            <p className="text-slate-600 mb-3.5 leading-relaxed">
              Sube el archivo de Excel con el que estás registrando los paros en tu planta. El sistema mapea automáticamente las columnas (Fecha, Línea, Problema/Falla, Categoría, Duración, Turno, etc.) y calcula la semana del año.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-upload-input"
              />
              <label
                htmlFor="excel-file-upload-input"
                className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer inline-flex items-center gap-2 shadow-xs transition-colors ${
                  isProcessing ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                {isProcessing ? 'Procesando archivo...' : 'Seleccionar Archivo Excel'}
              </label>

              <button
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg cursor-pointer inline-flex items-center gap-1.5 transition-colors"
              >
                <FileDown className="w-4 h-4 text-slate-500" />
                Descargar Plantilla Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Section 2: Export Data */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4 text-blue-600" />
                  Exportar Base de Datos a Excel (.xlsx)
                </h4>
                <p className="text-slate-600 mt-1 max-w-md">
                  Genera un archivo Excel completo con todos los {records.length} registros y hojas de catálogo maestro.
                </p>
              </div>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer shrink-0 shadow-xs transition-colors"
              >
                Exportar Excel
              </button>
            </div>
          </div>

          {/* Section 3: Export Charts and Tables as PNG Image (1080x720) */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <Image className="w-4 h-4 text-blue-600" />
                  Exportar Gráficas y Tablas a Imagen (.png en 1080x720)
                </h4>
                <p className="text-slate-600 mt-1 text-xs max-w-md">
                  Cada gráfica (Pareto 80/20, Tendencia Semanal, Comparativa de Turnos) y tabla cuenta con un botón directo <strong className="text-blue-800">"Descargar PNG (1080x720)"</strong> que guarda el contenido completo sin recortes, con título y leyenda en la esquina superior izquierda.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-md border border-blue-200">
                  📸 Formato 1080 × 720 HD
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Reset Demo Data */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  Restaurar Dataset de Prueba
                </h4>
                <p className="text-slate-600 mt-1">
                  Vuelve a los datos de demostración originales con 35+ paros en 5 líneas.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('¿Restablecer los datos de demostración iniciales?')) {
                    onResetDemoData();
                    setFeedbackMessage('Datos de demostración restaurados.');
                  }
                }}
                className="px-3.5 py-2 border border-amber-300 text-amber-800 hover:bg-amber-100/60 font-semibold rounded-lg cursor-pointer shrink-0 transition-colors"
              >
                Restaurar Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
