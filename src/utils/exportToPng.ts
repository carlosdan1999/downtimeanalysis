import { toPng } from 'html-to-image';

export interface LegendItem {
  label: string;
  color: string;
  type?: 'rect' | 'circle' | 'line' | 'dashed';
  textColor?: string;
  badge?: string;
}

export interface KpiBadge {
  label: string;
  value: string;
  color?: string;
}

export interface Export1080pOptions {
  filename?: string;
  title: string;
  subtitle?: string;
  legendItems?: LegendItem[];
  kpis?: KpiBadge[];
  svgElement?: SVGElement | null;
  tableElement?: HTMLTableElement | HTMLElement | null;
  element?: HTMLElement | null;
  renderCustom?: (container: HTMLElement) => void;
  footerNote?: string;
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}

// Backwards compatibility alias
export type Export1080x720Options = Export1080pOptions;

export interface ExportPngOptions {
  filename?: string;
  backgroundColor?: string;
  pixelRatio?: number;
  quality?: number;
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Downloads a data URL as a file with a given filename
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a complete 1080p Full HD (1920 × 1080 px, 16:9) PNG image
 * for any chart or table to be placed directly into presentation slides (PowerPoint, Keynote, Google Slides).
 * 
 * - Standard 1080p Full HD resolution (1920 × 1080 px) with 2x supersampling (3840×2160) for razor-sharp text and labels
 * - Title and legend strictly in the upper-left corner (esquina superior izquierda)
 * - Hero focus on the chart with legible data labels, zero clippings, and complete content
 * - Presentation-grade table formatting for tables
 */
export async function exportTo1080pFullHdPng(
  options: Export1080pOptions
): Promise<string> {
  const {
    filename = `grafica_1080p_full_hd_${new Date().toISOString().slice(0, 10)}.png`,
    title,
    subtitle,
    legendItems = [],
    kpis = [],
    svgElement,
    tableElement,
    element,
    renderCustom,
    footerNote = 'Sistema de Control de Tiempo Muerto · Planta Industrial',
    onSuccess,
    onError,
  } = options;

  // 1. Create a dark modal overlay in the viewport so all styles and dimensions are real (NOT offscreen -9999px)
  const overlay = document.createElement('div');
  overlay.setAttribute('id', 'export-1080p-overlay');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.82)';
  overlay.style.backdropFilter = 'blur(6px)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.overflow = 'hidden';

  // Informative indicator badge
  const indicator = document.createElement('div');
  indicator.style.marginBottom = '14px';
  indicator.style.padding = '8px 22px';
  indicator.style.borderRadius = '9999px';
  indicator.style.backgroundColor = '#0f172a';
  indicator.style.border = '1px solid #334155';
  indicator.style.color = '#ffffff';
  indicator.style.fontSize = '13px';
  indicator.style.fontWeight = '700';
  indicator.style.letterSpacing = '-0.01em';
  indicator.style.boxShadow = '0 12px 30px -5px rgba(0, 0, 0, 0.5)';
  indicator.style.display = 'flex';
  indicator.style.alignItems = 'center';
  indicator.style.gap = '10px';
  indicator.innerHTML = `
    <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background-color:#38bdf8;box-shadow:0 0 10px #38bdf8;"></span>
    <span>Exportando en Calidad 1080p Full HD (1920 × 1080 px) para Presentaciones...</span>
  `;
  overlay.appendChild(indicator);

  // Wrapper for responsive preview scaling on smaller screen sizes during capture
  const viewportW = window.innerWidth || 1920;
  const viewportH = window.innerHeight || 1080;
  const scale = Math.min((viewportW - 60) / 1920, (viewportH - 100) / 1080, 1);

  const wrapper = document.createElement('div');
  wrapper.style.width = '1920px';
  wrapper.style.height = '1080px';
  wrapper.style.transform = `scale(${Math.max(0.12, scale)})`;
  wrapper.style.transformOrigin = 'center center';
  wrapper.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.6)';
  wrapper.style.borderRadius = '16px';
  wrapper.style.overflow = 'hidden';
  wrapper.style.backgroundColor = '#ffffff';

  // 2. The Staging container: EXACTLY 1920x1080 (16:9 Presentation Standard)
  const staging = document.createElement('div');
  staging.setAttribute('id', 'export-1080p-staging');
  staging.style.position = 'relative';
  staging.style.left = '0';
  staging.style.top = '0';
  staging.style.width = '1920px';
  staging.style.height = '1080px';
  staging.style.minWidth = '1920px';
  staging.style.minHeight = '1080px';
  staging.style.maxWidth = '1920px';
  staging.style.maxHeight = '1080px';
  staging.style.boxSizing = 'border-box';
  staging.style.backgroundColor = '#ffffff';
  staging.style.color = '#0f172a';
  staging.style.fontFamily =
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  staging.style.padding = '32px 48px 24px 48px';
  staging.style.display = 'flex';
  staging.style.flexDirection = 'column';
  staging.style.justifyContent = 'space-between';
  staging.style.overflow = 'hidden';

  // 3. TOP HEADER (Upper-left corner: Title and Legend strictly together)
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'flex-start';
  header.style.marginBottom = '18px';
  header.style.paddingBottom = '16px';
  header.style.borderBottom = '1.5px solid #e2e8f0';
  header.style.flexShrink = '0';

  // Left Section (Esquina superior izquierda): Title + Subtitle + Legend
  const topLeft = document.createElement('div');
  topLeft.style.display = 'flex';
  topLeft.style.flexDirection = 'column';
  topLeft.style.gap = '8px';
  topLeft.style.maxWidth = '1350px';

  // Title with decorative bullet
  const titleWrapper = document.createElement('div');
  titleWrapper.style.display = 'flex';
  titleWrapper.style.alignItems = 'center';
  titleWrapper.style.gap = '12px';

  const bullet = document.createElement('span');
  bullet.style.width = '14px';
  bullet.style.height = '14px';
  bullet.style.borderRadius = '50%';
  bullet.style.backgroundColor = '#2563eb';
  bullet.style.boxShadow = '0 0 10px rgba(37, 99, 235, 0.4)';
  bullet.style.display = 'inline-block';
  bullet.style.flexShrink = '0';
  titleWrapper.appendChild(bullet);

  const titleEl = document.createElement('h1');
  titleEl.innerText = title;
  titleEl.style.margin = '0';
  titleEl.style.fontSize = '26px';
  titleEl.style.fontWeight = '800';
  titleEl.style.color = '#0f172a';
  titleEl.style.lineHeight = '1.2';
  titleEl.style.letterSpacing = '-0.025em';
  titleWrapper.appendChild(titleEl);
  topLeft.appendChild(titleWrapper);

  // Subtitle
  if (subtitle) {
    const subEl = document.createElement('div');
    subEl.innerText = subtitle;
    subEl.style.fontSize = '15px';
    subEl.style.color = '#475569';
    subEl.style.fontWeight = '500';
    subEl.style.marginLeft = '26px';
    topLeft.appendChild(subEl);
  }

  // Legend directly in the upper-left corner
  if (legendItems.length > 0) {
    const legendContainer = document.createElement('div');
    legendContainer.style.display = 'flex';
    legendContainer.style.flexWrap = 'wrap';
    legendContainer.style.gap = '20px';
    legendContainer.style.alignItems = 'center';
    legendContainer.style.marginTop = '6px';
    legendContainer.style.marginLeft = '26px';

    legendItems.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.style.display = 'flex';
      itemEl.style.alignItems = 'center';
      itemEl.style.gap = '8px';
      itemEl.style.fontSize = '13px';
      itemEl.style.fontWeight = '700';
      itemEl.style.color = item.textColor || '#1e293b';

      const symbol = document.createElement('span');
      symbol.style.display = 'inline-block';
      symbol.style.flexShrink = '0';

      if (item.type === 'circle') {
        symbol.style.width = '12px';
        symbol.style.height = '12px';
        symbol.style.borderRadius = '50%';
        symbol.style.backgroundColor = item.color;
      } else if (item.type === 'line') {
        symbol.style.width = '24px';
        symbol.style.height = '4px';
        symbol.style.borderRadius = '2px';
        symbol.style.backgroundColor = item.color;
      } else if (item.type === 'dashed') {
        symbol.style.width = '24px';
        symbol.style.height = '0';
        symbol.style.borderTop = `3px dashed ${item.color}`;
      } else {
        // default rect
        symbol.style.width = '14px';
        symbol.style.height = '14px';
        symbol.style.borderRadius = '3px';
        symbol.style.backgroundColor = item.color;
      }

      itemEl.appendChild(symbol);

      const labelText = document.createElement('span');
      labelText.innerText = item.label;
      itemEl.appendChild(labelText);

      if (item.badge) {
        const badgeSpan = document.createElement('span');
        badgeSpan.innerText = item.badge;
        badgeSpan.style.fontSize = '11px';
        badgeSpan.style.fontWeight = '700';
        badgeSpan.style.padding = '2px 7px';
        badgeSpan.style.borderRadius = '6px';
        badgeSpan.style.backgroundColor = '#f1f5f9';
        badgeSpan.style.color = '#1e293b';
        badgeSpan.style.border = '1px solid #e2e8f0';
        badgeSpan.style.marginLeft = '4px';
        itemEl.appendChild(badgeSpan);
      }

      legendContainer.appendChild(itemEl);
    });

    topLeft.appendChild(legendContainer);
  }

  header.appendChild(topLeft);

  // Right Section: Presentation Badge & KPIs
  const topRight = document.createElement('div');
  topRight.style.display = 'flex';
  topRight.style.flexDirection = 'column';
  topRight.style.alignItems = 'flex-end';
  topRight.style.gap = '8px';

  // KPI badges if any
  if (kpis.length > 0) {
    const kpiRow = document.createElement('div');
    kpiRow.style.display = 'flex';
    kpiRow.style.gap = '10px';

    kpis.forEach((kpi) => {
      const kpiCard = document.createElement('div');
      kpiCard.style.padding = '6px 12px';
      kpiCard.style.backgroundColor = '#f8fafc';
      kpiCard.style.border = '1px solid #cbd5e1';
      kpiCard.style.borderRadius = '8px';
      kpiCard.style.fontSize = '12px';
      kpiCard.style.color = '#334155';
      kpiCard.style.display = 'flex';
      kpiCard.style.gap = '6px';
      kpiCard.style.alignItems = 'center';

      const kLabel = document.createElement('span');
      kLabel.innerText = `${kpi.label}:`;
      kLabel.style.fontWeight = '500';
      kpiCard.appendChild(kLabel);

      const kVal = document.createElement('span');
      kVal.innerText = kpi.value;
      kVal.style.fontWeight = '800';
      kVal.style.color = kpi.color || '#0f172a';
      kpiCard.appendChild(kVal);

      kpiRow.appendChild(kpiCard);
    });
    topRight.appendChild(kpiRow);
  }

  // Dimension tag and presentation note
  const metaRow = document.createElement('div');
  metaRow.style.display = 'flex';
  metaRow.style.alignItems = 'center';
  metaRow.style.gap = '10px';

  const badge = document.createElement('span');
  badge.innerText = '1080p FULL HD (1920 × 1080)';
  badge.style.fontSize = '11px';
  badge.style.fontWeight = '800';
  badge.style.color = '#1d4ed8';
  badge.style.backgroundColor = '#dbeafe';
  badge.style.border = '1px solid #93c5fd';
  badge.style.borderRadius = '6px';
  badge.style.padding = '3px 8px';
  badge.style.letterSpacing = '0.04em';
  metaRow.appendChild(badge);

  const dateSpan = document.createElement('span');
  const now = new Date();
  dateSpan.innerText = now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  dateSpan.style.fontSize = '12px';
  dateSpan.style.color = '#64748b';
  dateSpan.style.fontWeight = '500';
  metaRow.appendChild(dateSpan);

  topRight.appendChild(metaRow);
  header.appendChild(topRight);

  staging.appendChild(header);

  // 4. MAIN CONTENT CONTAINER (Calibrated for 1080p Full HD Presentation Slides)
  const mainContent = document.createElement('div');
  mainContent.style.flex = '1';
  mainContent.style.minHeight = '0';
  mainContent.style.width = '100%';
  mainContent.style.display = 'flex';
  mainContent.style.flexDirection = 'column';
  mainContent.style.overflow = 'hidden';
  mainContent.style.position = 'relative';

  if (renderCustom) {
    renderCustom(mainContent);
  } else if (svgElement) {
    // Deep clone the SVG element and optimize it for full 1080p slide display
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clonedSvg.setAttribute('width', '100%');
    clonedSvg.setAttribute('height', '100%');

    // Strip restrictive layout classes from live DOM (e.g. h-64, sm:h-72)
    clonedSvg.classList.remove('h-64', 'sm:h-72', 'min-w-[760px]', 'h-auto', 'w-full');
    clonedSvg.style.width = '100%';
    clonedSvg.style.height = '100%';
    clonedSvg.style.maxWidth = '100%';
    clonedSvg.style.maxHeight = '100%';
    clonedSvg.style.minWidth = '0';
    clonedSvg.style.minHeight = '0';
    clonedSvg.style.display = 'block';
    clonedSvg.style.overflow = 'visible';

    // Ensure clean font family for SVG texts and enhance clarity
    const allTexts = clonedSvg.querySelectorAll('text');
    allTexts.forEach((t) => {
      const tel = t as SVGTextElement;
      tel.style.fontFamily =
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      // Enhance text contrast for presentation readability
      if (!tel.getAttribute('stroke')) {
        tel.style.textRendering = 'geometricPrecision';
      }
    });

    const svgWrapper = document.createElement('div');
    svgWrapper.style.width = '100%';
    svgWrapper.style.height = '100%';
    svgWrapper.style.flex = '1';
    svgWrapper.style.display = 'flex';
    svgWrapper.style.alignItems = 'center';
    svgWrapper.style.justifyContent = 'center';
    svgWrapper.style.overflow = 'visible';
    svgWrapper.style.padding = '8px 14px';
    svgWrapper.appendChild(clonedSvg);

    mainContent.appendChild(svgWrapper);
  } else if (tableElement) {
    // Clone table and format cleanly for 1080p Full HD slide presentation
    const clonedTable = tableElement.cloneNode(true) as HTMLElement;
    clonedTable.style.width = '100%';
    clonedTable.style.borderCollapse = 'collapse';
    clonedTable.style.fontSize = '13px';
    clonedTable.style.fontFamily =
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    clonedTable.style.color = '#0f172a';
    clonedTable.style.backgroundColor = '#ffffff';

    // Remove buttons or ignored interactive items
    const ignores = clonedTable.querySelectorAll(
      '[data-export-ignore="true"], button'
    );
    ignores.forEach((btn) => btn.remove());

    // Style table headers
    const ths = clonedTable.querySelectorAll('th');
    ths.forEach((th) => {
      const el = th as HTMLElement;
      el.style.backgroundColor = '#0f172a';
      el.style.color = '#f8fafc';
      el.style.fontWeight = '700';
      el.style.padding = '12px 16px';
      el.style.borderBottom = '2px solid #334155';
      el.style.fontSize = '12px';
      el.style.textTransform = 'uppercase';
      el.style.letterSpacing = '0.04em';
    });

    // Style table rows
    const trs = clonedTable.querySelectorAll('tbody tr');
    // If table has many rows, adjust padding dynamically so everything fits in 1080p
    const rowCount = trs.length;
    const padY = rowCount > 15 ? '6px' : rowCount > 10 ? '9px' : '12px';
    const rowFontSize = rowCount > 20 ? '11px' : rowCount > 14 ? '12px' : '13px';

    trs.forEach((tr, idx) => {
      const el = tr as HTMLElement;
      el.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      el.style.borderBottom = '1px solid #e2e8f0';

      const tds = el.querySelectorAll('td');
      tds.forEach((td) => {
        const tel = td as HTMLElement;
        tel.style.padding = `${padY} 16px`;
        tel.style.fontSize = rowFontSize;
        tel.style.color = '#0f172a';
      });
    });

    const tableWrapper = document.createElement('div');
    tableWrapper.style.width = '100%';
    tableWrapper.style.flex = '1';
    tableWrapper.style.overflow = 'hidden';
    tableWrapper.style.borderRadius = '10px';
    tableWrapper.style.border = '1px solid #cbd5e1';
    tableWrapper.style.backgroundColor = '#ffffff';
    tableWrapper.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
    tableWrapper.appendChild(clonedTable);

    mainContent.appendChild(tableWrapper);
  } else if (element) {
    const cloned = element.cloneNode(true) as HTMLElement;
    cloned.style.width = '100%';
    cloned.style.height = '100%';
    cloned.style.flex = '1';
    cloned.style.overflow = 'hidden';
    cloned.style.maxWidth = '100%';
    cloned.style.maxHeight = '100%';
    cloned.style.boxShadow = 'none';
    cloned.style.border = 'none';

    // Remove buttons marked to ignore
    const ignores = cloned.querySelectorAll(
      '[data-export-ignore="true"], .export-ignore, button'
    );
    ignores.forEach((btn) => btn.remove());

    mainContent.appendChild(cloned);
  }

  staging.appendChild(mainContent);

  // 5. FOOTER
  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'space-between';
  footer.style.alignItems = 'center';
  footer.style.paddingTop = '14px';
  footer.style.marginTop = '10px';
  footer.style.borderTop = '1px solid #f1f5f9';
  footer.style.fontSize = '12px';
  footer.style.color = '#94a3b8';
  footer.style.flexShrink = '0';

  const footerLeft = document.createElement('span');
  footerLeft.innerText = footerNote;
  footer.appendChild(footerLeft);

  const footerRight = document.createElement('span');
  footerRight.innerText =
    'Resolución: 1080p Full HD (1920 × 1080 px) · Diapositiva 16:9 con Etiquetas Legibles';
  footer.appendChild(footerRight);

  staging.appendChild(footer);

  // Assemble into DOM
  wrapper.appendChild(staging);
  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);

  // Wait for browser layout, styling, and paint
  await new Promise((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setTimeout(resolve, 200))
    )
  );

  try {
    const dataUrl = await toPng(staging, {
      width: 1920,
      height: 1080,
      canvasWidth: 3840, // 2x supersampling for high definition presentation slides
      canvasHeight: 2160,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipFonts: true, // Prevents CORS errors and font blank out
      style: {
        transform: 'none',
        left: '0px',
        top: '0px',
        position: 'relative',
        margin: '0px',
      },
    });

    downloadDataUrl(dataUrl, filename);
    if (onSuccess) onSuccess();
    return dataUrl;
  } catch (err) {
    console.warn('1080p Full HD export retry at pixelRatio 1.5:', err);
    try {
      const fallbackUrl = await toPng(staging, {
        width: 1920,
        height: 1080,
        canvasWidth: 2880,
        canvasHeight: 1620,
        pixelRatio: 1.5,
        backgroundColor: '#ffffff',
        skipFonts: true,
        cacheBust: true,
        style: {
          transform: 'none',
          left: '0px',
          top: '0px',
          position: 'relative',
        },
      });
      downloadDataUrl(fallbackUrl, filename);
      if (onSuccess) onSuccess();
      return fallbackUrl;
    } catch (fallbackErr) {
      console.error('Failed to export 1080p Full HD PNG:', fallbackErr);
      if (onError) onError(fallbackErr);
      throw fallbackErr;
    }
  } finally {
    // Clean up temporary DOM overlay
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}

/**
 * Backwards compatibility alias for exportTo1080x720Png -> now redirects to 1080p Full HD engine
 */
export async function exportTo1080x720Png(
  options: Export1080pOptions
): Promise<string> {
  return exportTo1080pFullHdPng(options);
}

/**
 * Captures an HTML element and exports it as a high-resolution PNG image
 */
export async function exportElementToPng(
  element: HTMLElement,
  options: ExportPngOptions = {}
): Promise<string> {
  const {
    filename = `exportacion_1080p_${new Date().toISOString().slice(0, 10)}.png`,
    backgroundColor = '#ffffff',
    pixelRatio = 2,
    quality = 0.98,
    onSuccess,
    onError,
  } = options;

  try {
    const dataUrl = await toPng(element, {
      backgroundColor,
      pixelRatio,
      quality,
      cacheBust: true,
      skipFonts: true,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          if (
            node.hasAttribute('data-export-ignore') ||
            node.classList.contains('export-ignore')
          ) {
            return false;
          }
        }
        return true;
      },
    });

    downloadDataUrl(dataUrl, filename);
    if (onSuccess) onSuccess();
    return dataUrl;
  } catch (error) {
    console.error('Error al exportar elemento a PNG:', error);
    try {
      const fallbackDataUrl = await toPng(element, {
        backgroundColor,
        pixelRatio: 1.5,
        skipFonts: true,
        cacheBust: true,
      });
      downloadDataUrl(fallbackDataUrl, filename);
      if (onSuccess) onSuccess();
      return fallbackDataUrl;
    } catch (fallbackError) {
      console.error('Fallback export error:', fallbackError);
      if (onError) onError(fallbackError);
      throw fallbackError;
    }
  }
}
