export interface ProjectPdfPlan {
  title: string;
  svg?: string;
}

export interface ProjectPdfQuoteItem {
  name: string;
  unit: string;
  quantity: number;
  unitPriceGtq: number;
}

export interface ProjectPdfLabor {
  subtotal: number;
  iva: number;
  percentage: number;
  projectType: string;
}

export interface ExportProjectPdfInput {
  projectName: string;
  projectType?: string;
  dimensions?: string;
  generatedAt?: Date;
  plans: ProjectPdfPlan[];
  quoteItems: ProjectPdfQuoteItem[];
  subtotal: number;
  iva: number;
  total: number;
  labor?: ProjectPdfLabor | null;
  grandIva?: number;
  latitude?: number;
  longitude?: number;
  addressText?: string;
  mapContainer?: HTMLElement | null;
}

// Colores corporativos FGE
const COLORS = {
  primary: [30, 58, 138] as [number, number, number], // blue-900
  secondary: [37, 99, 235] as [number, number, number], // blue-600
  accent: [251, 191, 36] as [number, number, number], // amber-400
  dark: [15, 23, 42] as [number, number, number], // slate-900
  medium: [71, 85, 105] as [number, number, number], // slate-600
  light: [248, 250, 252] as [number, number, number], // slate-50
  white: [255, 255, 255] as [number, number, number],
  success: [22, 163, 74] as [number, number, number], // green-600
  border: [226, 232, 240] as [number, number, number], // slate-200
};

function sanitizeText(text: string): string {
  return text
    .replace(/\u00f1/g, 'n') // ñ → n
    .replace(/\u00d1/g, 'N') // Ñ → N
    .replace(/\u00e1/g, 'a') // á → a
    .replace(/\u00e9/g, 'e') // é → e
    .replace(/\u00ed/g, 'i') // í → i
    .replace(/\u00f3/g, 'o') // ó → o
    .replace(/\u00fa/g, 'u') // ú → u
    .replace(/\u00c1/g, 'A')
    .replace(/\u00c9/g, 'E')
    .replace(/\u00cd/g, 'I')
    .replace(/\u00d3/g, 'O')
    .replace(/\u00da/g, 'U')
    .replace(/\u00fc/g, 'u') // ü → u
    .replace(/\u00e0/g, 'a')
    .replace(/[^\x20-\x7E]/g, ''); // eliminar cualquier otro no-ASCII
}

function s(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '';
  return sanitizeText(String(text));
}

function formatCurrency(value: number): string {
  return `Q ${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatFileName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // eliminar diacríticos
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60);
}

async function svgToPngDataUrl(svg: string): Promise<string> {
  const encodedSvg = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  const imageUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar SVG'));
    img.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || 1200;
  canvas.height = image.naturalHeight || 900;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

// Dibuja encabezado corporativo en cada página
function drawPageHeader(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  pageNum: number,
  totalPages: number,
  pageWidth: number,
): void {
  // Barra azul superior
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 12, 'F');

  // Logo/nombre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text('FUNDACION GENESIS EMPRESARIAL', 10, 8);

  // Número de página derecha
  doc.setFont('helvetica', 'normal');
  doc.text(`Pag. ${pageNum}`, pageWidth - 10, 8, { align: 'right' });

  doc.setTextColor(...COLORS.dark);
}

// Dibuja pie de página
function drawPageFooter(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  pageWidth: number,
  pageHeight: number,
  projectName: string,
): void {
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.medium);
  doc.text(
    `${s(projectName)} | Generado por FGE Cotizador | Documento referencial`,
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' },
  );
  doc.setTextColor(...COLORS.dark);
}

// Dibuja título de sección
function drawSectionTitle(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  title: string,
  y: number,
  pageWidth: number,
): number {
  doc.setFillColor(...COLORS.secondary);
  doc.rect(10, y, pageWidth - 20, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text(s(title).toUpperCase(), 14, y + 5.5);
  doc.setTextColor(...COLORS.dark);
  return y + 12;
}

export async function exportProjectPdf(
  input: ExportProjectPdfInput,
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // ─── PORTADA ─────────────────────────────────────────────────
  // Fondo completo azul oscuro
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Franja dorada superior decorativa (debajo del topbar)
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 18, pageWidth, 2, 'F');

  // ── Bloque superior: organización (zona 0-18mm) ──
  doc.setFillColor(20, 40, 100); // azul más oscuro
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 190, 230);
  doc.text(
    'FUNDACION GENESIS EMPRESARIAL — Guatemala',
    pageWidth / 2,
    11,
    { align: 'center' },
  );

  // ── Zona central: títulos (35-80mm) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...COLORS.white);
  doc.text('COTIZACION', pageWidth / 2, 50, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(180, 210, 255);
  doc.text('DE CONSTRUCCION', pageWidth / 2, 65, { align: 'center' });

  // Línea dorada divisoria
  doc.setFillColor(...COLORS.accent);
  doc.rect(margin + 20, 72, pageWidth - (margin + 20) * 2, 1.5, 'F');

  // ── Nombre del proyecto (85-100mm) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.accent);
  const safeProjectName = s(input.projectName) || 'Sin nombre';
  const displayName = safeProjectName.length > 38
    ? `${safeProjectName.slice(0, 38)}...`
    : safeProjectName;
  doc.text(displayName, pageWidth / 2, 86, { align: 'center' });

  // ── Caja de datos del proyecto (110-200mm) ──
  // Fondo semitransparente para la caja
  doc.setFillColor(20, 45, 110);
  doc.roundedRect(margin + 10, 100, pageWidth - (margin + 10) * 2, 80, 3, 3, 'F');

  const infoItems = [
    { label: 'TIPO DE PROYECTO', value: s(input.projectType) || 'No especificado' },
    { label: 'DIMENSIONES', value: s(input.dimensions) || 'No especificadas' },
    {
      label: 'FECHA DE GENERACION',
      value: (input.generatedAt ?? new Date()).toLocaleDateString('es-GT', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
    },
  ];

  infoItems.forEach(({ label, value }, i) => {
    const baseY = 115 + i * 24;

    // Separador entre items (no antes del primero)
    if (i > 0) {
      doc.setDrawColor(40, 70, 140);
      doc.setLineWidth(0.3);
      doc.line(margin + 20, baseY - 6, pageWidth - margin - 20, baseY - 6);
    }

    // Label pequeño
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 170, 220);
    doc.text(label, pageWidth / 2, baseY, { align: 'center' });

    // Valor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.white);
    doc.text(s(value), pageWidth / 2, baseY + 7, { align: 'center' });
  });

  // ── Nota legal (zona inferior) ──
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 130, 180);
  doc.text(
    'Documento de cotizacion referencial. Precios en Quetzales (GTQ) con IVA incluido.',
    pageWidth / 2,
    pageHeight - 20,
    { align: 'center' },
  );
  doc.text(
    'Los montos de mano de obra son estimados sujetos a negociacion con el contratista.',
    pageWidth / 2,
    pageHeight - 14,
    { align: 'center' },
  );
  doc.text(
    'Fundacion Genesis Empresarial — FGE Cotizador',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' },
  );

  // ─── FIN PORTADA ─────────────────────────────────────────────

  // ─── PÁGINAS DE PLANOS ───────────────────────────────────────────
  let pageNum = 2;
  const plansWithSvg = input.plans.filter((p) => p.svg);
  const plansWithout = input.plans.filter((p) => !p.svg);

  for (const plan of plansWithSvg) {
    doc.addPage();
    drawPageHeader(doc, pageNum, 999, pageWidth);
    drawPageFooter(doc, pageWidth, pageHeight, input.projectName);
    pageNum++;

    // Título del plano
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.dark);
    doc.text(s(plan.title), margin, 22);

    // Línea decorativa
    doc.setDrawColor(...COLORS.secondary);
    doc.setLineWidth(0.5);
    doc.line(margin, 25, pageWidth - margin, 25);

    try {
      const imageData = await svgToPngDataUrl(plan.svg!);
      const imgY = 28;
      const imgH = pageHeight - imgY - 18;
      doc.addImage(
        imageData,
        'PNG',
        margin,
        imgY,
        pageWidth - margin * 2,
        imgH,
        undefined,
        'FAST',
      );
    } catch {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.medium);
      doc.text('Plano no disponible', margin, 40);
    }
  }

  // Página de planos pendientes (si hay)
  if (plansWithout.length > 0) {
    doc.addPage();
    drawPageHeader(doc, pageNum, 999, pageWidth);
    drawPageFooter(doc, pageWidth, pageHeight, input.projectName);
    pageNum++;

    let y = drawSectionTitle(doc, 'Planos no generados', 18, pageWidth);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.medium);
    plansWithout.forEach((plan) => {
      doc.text(`• ${s(plan.title)}`, margin + 5, y);
      y += 7;
    });
  }

  // ─── PÁGINA DE COTIZACIÓN ────────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, pageNum, 999, pageWidth);
  drawPageFooter(doc, pageWidth, pageHeight, input.projectName);
  pageNum++;

  let y = drawSectionTitle(doc, 'Resumen de Cotizacion de Materiales', 18, pageWidth);

  if (input.quoteItems.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.medium);
    doc.text('Sin materiales cotizados.', margin, y + 8);
    y += 20;
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Material', 'Unidad', 'Cant.', 'P. Unit (IVA incl.)', 'Subtotal']],
      body: input.quoteItems.map((item) => [
        s(item.name),
        s(item.unit),
        String(item.quantity),
        formatCurrency(item.unitPriceGtq),
        formatCurrency(item.unitPriceGtq * item.quantity),
      ]),
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'helvetica',
        textColor: COLORS.dark,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: COLORS.light },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    const autoDoc = doc as unknown as { lastAutoTable?: { finalY?: number } };
    y = (autoDoc.lastAutoTable?.finalY ?? y) + 6;
  }

  // ─── RESUMEN FINANCIERO ──────────────────────────────────────────
  // Caja de resumen financiero
  const summaryData: Array<[string, string, boolean]> = [
    ['Subtotal materiales (IVA incluido)', formatCurrency(input.subtotal), false],
    ['IVA 12% materiales (incluido en precio)', formatCurrency(input.iva), false],
  ];

  if (input.labor && input.labor.subtotal > 0) {
    summaryData.push([
      `Mano de obra estimada (${input.labor.percentage.toFixed(0)}% - ${s(input.labor.projectType)})`,
      formatCurrency(input.labor.subtotal),
      false,
    ]);
    summaryData.push(['IVA 12% mano de obra (incluido)', formatCurrency(input.labor.iva), false]);
  }

  summaryData.push(['IVA TOTAL INCLUIDO', formatCurrency(input.grandIva ?? input.iva), false]);
  summaryData.push([
    'TOTAL GENERAL',
    formatCurrency(input.total + (input.labor?.subtotal ?? 0)),
    true,
  ]);

  // Verificar espacio en página
  if (y + summaryData.length * 8 + 20 > pageHeight - 20) {
    doc.addPage();
    drawPageHeader(doc, pageNum, 999, pageWidth);
    drawPageFooter(doc, pageWidth, pageHeight, input.projectName);
    pageNum++;
    y = 22;
  }

  y = drawSectionTitle(doc, 'Resumen Financiero', y + 4, pageWidth);

  summaryData.forEach(([label, value, isTotal]) => {
    if (isTotal) {
      doc.setFillColor(...COLORS.primary);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.white);
    } else {
      doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.dark);
    }
    doc.text(s(label), margin + 3, y + 2);
    doc.text(s(value), pageWidth - margin - 3, y + 2, { align: 'right' });
    doc.setTextColor(...COLORS.dark);

    if (!isTotal) {
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 5, pageWidth - margin, y + 5);
    }
    y += 9;
  });

  // Nota de mano de obra
  if (input.labor && input.labor.subtotal > 0) {
    y += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.medium);
    doc.text(
      '* Mano de obra es un estimado referencial sujeto a negociacion con el contratista.',
      margin,
      y,
    );
  }

  // ─── PÁGINA DE UBICACIÓN ─────────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, pageNum, 999, pageWidth);
  drawPageFooter(doc, pageWidth, pageHeight, input.projectName);

  y = drawSectionTitle(doc, 'Ubicacion del Proyecto', 18, pageWidth);

  // Datos de ubicación en tabla
  autoTable(doc, {
    startY: y,
    body: [
      ['Direccion', s(input.addressText) || 'No especificada'],
      ['Latitud', String(input.latitude ?? 'No definida')],
      ['Longitud', String(input.longitude ?? 'No definida')],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, textColor: COLORS.medium },
      1: { textColor: COLORS.dark },
    },
    margin: { left: margin, right: margin },
  });

  const locDoc = doc as unknown as { lastAutoTable?: { finalY?: number } };
  const mapY = (locDoc.lastAutoTable?.finalY ?? y) + 6;

  const mapImage = await (async () => {
    if (!input.mapContainer) return null;
    const mapCanvas = input.mapContainer.querySelector('canvas') as HTMLCanvasElement | null;
    if (!mapCanvas) return null;
    try {
      return mapCanvas.toDataURL('image/png');
    } catch {
      return null;
    }
  })();

  if (mapImage) {
    doc.addImage(mapImage, 'PNG', margin, mapY, pageWidth - margin * 2, 90, undefined, 'FAST');
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.medium);
    doc.text(
      'Mapa no disponible. Verificar ubicacion con las coordenadas indicadas.',
      margin,
      mapY + 8,
    );
  }

  // ─── GUARDAR ─────────────────────────────────────────────────────
  const fileName = formatFileName(input.projectName || 'proyecto');
  doc.save(`fge-${fileName || 'proyecto'}.pdf`);
}
