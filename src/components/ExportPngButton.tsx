import React, { useState } from 'react';
import { Image, Check, Loader2, Download } from 'lucide-react';
import {
  exportElementToPng,
  exportTo1080pFullHdPng,
  exportTo1080x720Png,
  Export1080pOptions,
} from '../utils/exportToPng';

interface ExportPngButtonProps {
  targetRef?: React.RefObject<HTMLElement | null>;
  filename: string;
  label?: string;
  tooltip?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'compact';
  className?: string;
  onCustomExport?: () => Promise<void>;
  export1080Config?: Omit<Export1080pOptions, 'filename'>;
}

export const ExportPngButton: React.FC<ExportPngButtonProps> = ({
  targetRef,
  filename,
  label = 'Descargar PNG (1080p Full HD)',
  tooltip = 'Guardar en alta resolución 1080p Full HD (1920x1080) listo para diapositivas de presentación',
  variant = 'secondary',
  className = '',
  onCustomExport,
  export1080Config,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [justExported, setJustExported] = useState(false);

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting) return;

    setIsExporting(true);
    try {
      if (onCustomExport) {
        await onCustomExport();
      } else if (export1080Config) {
        await exportTo1080pFullHdPng({
          ...export1080Config,
          filename,
        });
      } else if (targetRef && targetRef.current) {
        await exportElementToPng(targetRef.current, {
          filename,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
      } else {
        console.warn('No target or configuration provided to ExportPngButton');
      }

      setJustExported(true);
      setTimeout(() => setJustExported(false), 2400);
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Base styling variants
  let variantClasses =
    'px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ';
  if (variant === 'primary') {
    variantClasses += 'bg-blue-600 hover:bg-blue-700 text-white';
  } else if (variant === 'secondary') {
    variantClasses +=
      'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 hover:border-slate-300';
  } else if (variant === 'ghost') {
    variantClasses += 'bg-transparent hover:bg-slate-100 text-slate-600';
  } else if (variant === 'compact') {
    variantClasses =
      'p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer border border-transparent hover:border-blue-100';
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      title={tooltip}
      data-export-ignore="true"
      className={`${variantClasses} ${
        justExported ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : ''
      } ${className}`}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
          {variant !== 'compact' && <span>Generando 1080p Full HD...</span>}
        </>
      ) : justExported ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          {variant !== 'compact' && (
            <span className="text-emerald-700 font-bold">¡Guardado 1080p!</span>
          )}
        </>
      ) : (
        <>
          <Image className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          {variant !== 'compact' && <span>{label}</span>}
          {variant === 'compact' && <Download className="w-3 h-3 text-slate-400 shrink-0" />}
        </>
      )}
    </button>
  );
};
