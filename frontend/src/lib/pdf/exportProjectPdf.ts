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
  latitude?: number;
  longitude?: number;
  addressText?: string;
  mapContainer?: HTMLElement | null;
}

interface JsPdfAutoTableDoc {
  lastAutoTable?: { finalY?: number };
}

function formatCurrency(value: number): string {
  return `Q${Number(value).toFixed(2)}`;
}

async function svgToPngDataUrl(svg: string): Promise<string> {
  const encodedSvg = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/\"/g, '%22');
  const imageUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No fue posible cargar el SVG como imagen.'));
    img.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  const width = image.naturalWidth || image.width || 1200;
  const height = image.naturalHeight || image.height || 900;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No fue posible obtener el contexto del canvas.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/png');
}

async function tryCaptureMap(container?: HTMLElement | null): Promise<string | null> {
  if (!container) {
    return null;
  }

  const mapCanvas = container.querySelector('canvas') as HTMLCanvasElement | null;
  if (!mapCanvas) {
    return null;
  }

  try {
    return mapCanvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export async function exportProjectPdf(input: ExportProjectPdfInput): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Resumen del Proyecto', 20, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  const projectDate = (input.generatedAt ?? new Date()).toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const coverRows = [
    ['Proyecto', input.projectName || 'Sin nombre'],
    ['Tipo', input.projectType || 'No especificado'],
    ['Dimensiones', input.dimensions || 'No especificadas'],
    ['Fecha', projectDate],
  ];

  coverRows.forEach(([label, value], index) => {
    const y = 60 + index * 12;
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 55, y);
  });

  for (const plan of input.plans) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(plan.title, 20, 20);

    if (!plan.svg) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('No generado', 20, 32);
      continue;
    }

    try {
      const imageData = await svgToPngDataUrl(plan.svg);
      const maxWidth = pageWidth - 30;
      const maxHeight = pageHeight - 50;
      doc.addImage(imageData, 'PNG', 15, 28, maxWidth, maxHeight, undefined, 'FAST');
    } catch {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Plano no disponible', 20, 32);
    }
  }

  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Resumen de Cotización', 20, 20);

  autoTable(doc, {
    startY: 28,
    head: [['Material', 'Unidad', 'Cantidad', 'P.Unit (IVA incl)', 'Subtotal']],
    body: input.quoteItems.map(item => [
      item.name,
      item.unit,
      item.quantity.toString(),
      formatCurrency(item.unitPriceGtq),
      formatCurrency(item.unitPriceGtq * item.quantity),
    ]),
    theme: 'striped',
    styles: { fontSize: 10 },
  });

  const quoteDoc = doc as unknown as JsPdfAutoTableDoc;
  const totalsStartY = (quoteDoc.lastAutoTable?.finalY ?? 40) + 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Subtotal (IVA incluido): ${formatCurrency(input.subtotal)}`, 20, totalsStartY);
  doc.text(`IVA 12% (incluido): ${formatCurrency(input.iva)}`, 20, totalsStartY + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: ${formatCurrency(input.total)}`, 20, totalsStartY + 16);

  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Ubicación del Proyecto', 20, 20);

  const mapImage = await tryCaptureMap(input.mapContainer);

  if (mapImage) {
    doc.addImage(mapImage, 'PNG', 20, 30, pageWidth - 40, 90, undefined, 'FAST');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Latitud: ${input.latitude ?? 'No definida'}`, 20, 130);
    doc.text(`Longitud: ${input.longitude ?? 'No definida'}`, 20, 138);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Latitud: ${input.latitude ?? 'No definida'}`, 20, 35);
    doc.text(`Longitud: ${input.longitude ?? 'No definida'}`, 20, 44);
    doc.text(`Dirección: ${input.addressText || 'No especificada'}`, 20, 53);
    doc.text('No fue posible capturar el mapa. Se incluyen coordenadas como referencia.', 20, 65);
  }

  const fileName = `proyecto-${input.projectName || 'sin-nombre'}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  doc.save(`${fileName || 'proyecto'}.pdf`);
}
