import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DowntimeRecord, TimeUnit } from '../types/downtime';
import { calculatePareto } from './pareto';
import { formatDateLabel, formatDuration, formatHoursDecimal } from './dateUtils';

interface GenerateDailyPdfOptions {
  date: string;
  records: DowntimeRecord[];
  timeUnit?: TimeUnit;
  plantName?: string;
}

export function generateDailyReportPdf({
  date,
  records,
  timeUnit = 'hours',
  plantName = 'Planta de Manufactura - DowntimePro',
}: GenerateDailyPdfOptions): jsPDF {
  // Filter records for the specified date
  const dayRecords = records.filter((r) => r.date === date);

  // Compute Pareto by Line for this day
  const lineAnalysis = calculatePareto(dayRecords, 'line', 'duration');

  const totalMinutes = dayRecords.reduce((acc, r) => acc + r.durationMinutes, 0);
  const totalEvents = dayRecords.length;
  const mttrMinutes = totalEvents > 0 ? totalMinutes / totalEvents : 0;
  const affectedLinesCount = lineAnalysis.items.length;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner Background
  doc.setFillColor(30, 58, 138); // Dark Navy Blue (#1e3a8a)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative accent line
  doc.setFillColor(2, 132, 199); // Sky blue
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('REPORTE DIARIO DE TIEMPO MUERTO Y ANÁLISIS DE FALLAS', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Metodología Pareto 80/20 · Análisis de Causa Raíz y Acciones Correctivas · ${plantName}`,
    margin,
    18
  );

  // Metadata Right Aligned in Header
  const dateFormatted = formatDateLabel(date);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Fecha Auditada: ${date} (${dateFormatted})`, pageWidth - margin, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const printTimestamp = new Date().toLocaleString('es-MX');
  doc.text(`Generado: ${printTimestamp}`, pageWidth - margin, 18, { align: 'right' });

  // Core KPI Summary Box (30mm down to 52mm)
  let currentY = 34;

  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 2, 2, 'FD');

  const colWidth = (pageWidth - margin * 2) / 4;

  // KPI 1: Tiempo Muerto Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TIEMPO MUERTO TOTAL', margin + 4, currentY + 6);
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  const totalFormatted =
    timeUnit === 'minutes'
      ? `${Math.round(totalMinutes).toLocaleString('es-MX')} min`
      : formatHoursDecimal(totalMinutes);
  doc.text(totalFormatted, margin + 4, currentY + 13);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    timeUnit === 'minutes'
      ? `(${formatHoursDecimal(totalMinutes)})`
      : `(${Math.round(totalMinutes).toLocaleString('es-MX')} min)`,
    margin + 4,
    currentY + 17
  );

  // KPI 2: Total de Incidentes
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL INCIDENTES', margin + colWidth + 4, currentY + 6);
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalEvents} eventos`, margin + colWidth + 4, currentY + 13);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Paros no programados', margin + colWidth + 4, currentY + 17);

  // KPI 3: Líneas Afectadas
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('LÍNEAS AFECTADAS', margin + colWidth * 2 + 4, currentY + 6);
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text(`${affectedLinesCount} de ${lineAnalysis.items.length || 0}`, margin + colWidth * 2 + 4, currentY + 13);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('En operación', margin + colWidth * 2 + 4, currentY + 17);

  // KPI 4: MTTR Promedio
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('MTTR PROMEDIO', margin + colWidth * 3 + 4, currentY + 6);
  doc.setFontSize(12);
  doc.setTextColor(217, 119, 6);
  doc.text(`${Math.round(mttrMinutes)} min`, margin + colWidth * 3 + 4, currentY + 13);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Duración media por paro', margin + colWidth * 3 + 4, currentY + 17);

  currentY += 25;

  // SECTION 1: PARETO DE TIEMPO POR LÍNEA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. DISTRIBUCIÓN PARETO DE TIEMPO MUERTO POR LÍNEA DE PRODUCCIÓN', margin, currentY);

  currentY += 2;

  // Build Pareto by Line Table
  const paretoTableRows = lineAnalysis.items.map((item, idx) => {
    const formattedVal =
      timeUnit === 'minutes'
        ? `${Math.round(item.value).toLocaleString('es-MX')} min`
        : formatHoursDecimal(item.value);

    return [
      String(idx + 1),
      item.label,
      formattedVal,
      String(item.count),
      `${item.percentage.toFixed(1)}%`,
      `${item.cumulativePercentage.toFixed(1)}%`,
      item.isVitalFew ? 'Línea Vital (80%)' : 'Secundaria',
    ];
  });

  autoTable(doc, {
    startY: currentY + 2,
    margin: { left: margin, right: margin },
    head: [['#', 'Línea de Producción', `Tiempo (${timeUnit === 'minutes' ? 'min' : 'h'})`, 'Eventos', '% Ind.', '% Acum.', 'Clasificación 80/20']],
    body: paretoTableRows.length > 0 ? paretoTableRows : [['-', 'Sin eventos registrados en la fecha seleccionada', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] },
      6: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Get position after Pareto table
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || currentY + 30;
  currentY = finalY + 8;

  // Check if we need page break before Section 2 header
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  // SECTION 2: TABLA DE RESUMEN DETALLADA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. TABLA DE RESUMEN: LÍNEA, PROBLEMA, CAUSA RAÍZ Y ACCIÓN CORRECTIVA', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Registro integral de eventos con análisis de causa raíz y planes de acción inmediatos ejecutados en planta.',
    margin,
    currentY + 4
  );

  currentY += 6;

  // Detail rows for events
  const detailTableRows = dayRecords.map((r, idx) => {
    const formattedVal =
      timeUnit === 'minutes'
        ? `${r.durationMinutes} min`
        : formatHoursDecimal(r.durationMinutes);

    return [
      String(idx + 1),
      r.productionLine,
      `${r.problem}\n(${r.machine})`,
      r.rootCauseNotes || 'No especificada',
      r.actionTaken || 'No documentada',
      formattedVal,
      r.shift,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['#', 'Línea', 'Problema & Máquina', 'Causa Raíz', 'Acción Correctiva Ejecutada', `Tiempo`, 'Turno']],
    body:
      detailTableRows.length > 0
        ? detailTableRows
        : [['-', 'Sin registros', 'No se registraron paros en este día', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Slate-900
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 42, textColor: [71, 85, 105] },
      4: { cellWidth: 42, textColor: [15, 118, 110] }, // Teal-700
      5: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 16, halign: 'center' },
    },
    styles: {
      fontSize: 7,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    // Footer divider
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text(
      'DowntimePro · Sistema de Control de Tiempo Muerto y Mejora Continua TPM / Kaizen',
      margin,
      pageHeight - 7
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, {
      align: 'right',
    });
  }

  return doc;
}
