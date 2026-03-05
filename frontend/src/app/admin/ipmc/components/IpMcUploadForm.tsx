'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { ipmcService, IpMcImportResult } from '@/services/ipmc.service';

interface IpMcUploadFormProps {
  onImportSuccess: (result: IpMcImportResult) => void;
}

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export function IpMcUploadForm({ onImportSuccess }: Readonly<IpMcUploadFormProps>): JSX.Element {
  const currentDate = new Date();
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IpMcImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const years = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, index) => thisYear - index);
  }, []);

  async function handleUpload(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError('Debes seleccionar un archivo PDF.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Archivo inválido: solo se permiten archivos PDF.');
      return;
    }

    try {
      setIsLoading(true);
      const importResult = await ipmcService.uploadPdf({ year, month, file });
      setResult(importResult);
      onImportSuccess(importResult);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo importar el PDF.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImportFromUrl(): Promise<void> {
    setError(null);
    setResult(null);

    if (!pdfUrl.trim()) {
      setError('Debes ingresar una URL válida.');
      return;
    }

    try {
      setIsLoading(true);
      const importResult = await ipmcService.importFromUrl({ year, month, pdfUrl: pdfUrl.trim() });
      setResult(importResult);
      onImportSuccess(importResult);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'No se pudo importar desde URL.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Importar IPMC mensual</h2>
      <p className="mt-1 text-sm text-slate-600">Carga el PDF oficial del INE para actualizar los índices.</p>

      <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={handleUpload}>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Año
          <select
            className="rounded border border-slate-300 px-3 py-2"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {years.map((yearOption) => (
              <option key={yearOption} value={yearOption}>
                {yearOption}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Mes
          <select
            className="rounded border border-slate-300 px-3 py-2"
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
          >
            {MONTHS.map((monthOption) => (
              <option key={monthOption.value} value={monthOption.value}>
                {monthOption.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
          Archivo PDF
          <input
            ref={fileInputRef}
            className="rounded border border-slate-300 px-3 py-2"
            type="file"
            name="pdf"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <div className="md:col-span-4">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? 'Importando...' : 'Importar PDF'}
          </button>
        </div>
      </form>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="text-sm font-medium text-slate-800">Opcional: importar por URL</p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row">
          <input
            type="url"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="https://www.ine.gob.bo/.../ipmc.pdf"
            value={pdfUrl}
            onChange={(event) => setPdfUrl(event.target.value)}
          />
          <button
            type="button"
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
            disabled={isLoading}
            onClick={() => {
              void handleImportFromUrl();
            }}
          >
            Importar por URL
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {result ? (
        <div className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-800">
          <p>
            Importación completada: {result.itemsInserted} items insertados, {result.itemsSkipped} omitidos.
          </p>
          <p className="mt-1">
            Reporte: 
            <a className="font-medium underline" href={`#report-${result.reportId}`}>
              ver detalle ({result.year}/{String(result.month).padStart(2, '0')})
            </a>
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Si el mes ya existía, el backend lo reemplaza automáticamente con la nueva importación.
          </p>
        </div>
      ) : null}
    </section>
  );
}
