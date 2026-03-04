const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface IpMcReport {
  id: string;
  year: number;
  month: number;
  importedAt: string;
  source: string;
  pdfUrl: string | null;
  originalFilename: string | null;
}

export interface IpMcItem {
  id: string;
  reportId: string;
  code: number;
  material: string;
  unit: string;
  indexPrev: number | string;
  indexCurrent: number | string;
  variation: number | string;
  category: string | null;
}

export interface IpMcImportResult {
  reportId: string;
  year: number;
  month: number;
  itemsInserted: number;
  itemsSkipped: number;
}

interface UploadPdfPayload {
  year: number;
  month: number;
  file: File;
}

interface ImportFromUrlPayload {
  year: number;
  month: number;
  pdfUrl: string;
}

function buildUrl(path: string): string {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseApiError(response: Response): Promise<Error> {
  let message = `Error ${response.status}`;
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) {
      message = data.message.join(', ');
    } else if (data.message) {
      message = data.message;
    }
  } catch {
    // Ignorar errores de parseo.
  }

  return new Error(message);
}

export const ipmcService = {
  async uploadPdf(payload: UploadPdfPayload): Promise<IpMcImportResult> {
    const formData = new FormData();
    formData.append('year', String(payload.year));
    formData.append('month', String(payload.month));
    formData.append('pdf', payload.file);

    const response = await fetch(buildUrl('/ipmc/import'), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json() as Promise<IpMcImportResult>;
  },

  async importFromUrl(payload: ImportFromUrlPayload): Promise<IpMcImportResult> {
    const response = await fetch(buildUrl('/ipmc/import-from-url'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json() as Promise<IpMcImportResult>;
  },

  async listReports(): Promise<IpMcReport[]> {
    const response = await fetch(buildUrl('/ipmc/reports'), { method: 'GET' });
    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json() as Promise<IpMcReport[]>;
  },

  async getReportItems(reportId: string): Promise<IpMcItem[]> {
    const response = await fetch(buildUrl(`/ipmc/reports/${reportId}/items`), { method: 'GET' });
    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json() as Promise<IpMcItem[]>;
  },

  async getLatestReport(): Promise<IpMcReport> {
    const response = await fetch(buildUrl('/ipmc/reports/latest'), { method: 'GET' });
    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json() as Promise<IpMcReport>;
  },
};
