'use client';

import { IpMcReport } from '@/services/ipmc.service';

interface IpMcReportsListProps {
  reports: IpMcReport[];
  selectedReportId: string | null;
  latestReportId: string | null;
  onSelectReport: (reportId: string) => void;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function IpMcReportsList({
  reports,
  selectedReportId,
  latestReportId,
  onSelectReport,
}: Readonly<IpMcReportsListProps>): JSX.Element {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Reportes importados</h2>
      {reports.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No hay reportes importados todavía.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {reports.map((report) => {
            const isSelected = report.id === selectedReportId;
            return (
              <li
                key={report.id}
                id={`report-${report.id}`}
                className={`rounded border p-3 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {report.year}/{String(report.month).padStart(2, '0')} · {report.source}
                    </p>
                    <p className="text-xs text-slate-600">Importado: {formatDate(report.importedAt)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-3 py-1 text-sm transition-colors hover:bg-slate-50"
                      onClick={() => {
                        onSelectReport(report.id);
                        setTimeout(() => {
                          document.getElementById('ipmc-items-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      👁 Ver items
                    </button>
                    <button
                      type="button"
                      className="rounded bg-slate-900 px-3 py-1 text-sm text-white"
                      title="Conexión pendiente (Prompt 4)"
                      onClick={() => onSelectReport(report.id)}
                    >
                      Usar este mes en cotizador (default)
                    </button>
                  </div>
                </div>
                {report.id === latestReportId ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">Último reporte importado</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
