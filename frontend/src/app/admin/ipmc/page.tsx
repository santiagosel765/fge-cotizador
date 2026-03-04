'use client';

import { useCallback, useEffect, useState } from 'react';
import { IpMcItemsTable } from './components/IpMcItemsTable';
import { IpMcReportsList } from './components/IpMcReportsList';
import { IpMcUploadForm } from './components/IpMcUploadForm';
import { ipmcService, IpMcImportResult, IpMcItem, IpMcReport } from '@/services/ipmc.service';

export default function IpMcAdminPage(): JSX.Element {
  const [reports, setReports] = useState<IpMcReport[]>([]);
  const [latestReportId, setLatestReportId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [items, setItems] = useState<IpMcItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setPageError(null);
    setIsLoadingReports(true);

    try {
      const [reportsData, latestReport] = await Promise.all([
        ipmcService.listReports(),
        ipmcService.getLatestReport().catch(() => null),
      ]);

      setReports(reportsData);
      setLatestReportId(latestReport?.id ?? null);

      if (reportsData.length > 0) {
        setSelectedReportId((prev) => prev ?? latestReport?.id ?? reportsData[0].id);
      } else {
        setSelectedReportId(null);
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'No se pudieron cargar los reportes de IPMC.');
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  const loadItems = useCallback(async (reportId: string) => {
    setIsLoadingItems(true);
    setPageError(null);

    try {
      const reportItems = await ipmcService.getReportItems(reportId);
      setItems(reportItems);
    } catch (error) {
      setItems([]);
      setPageError(error instanceof Error ? error.message : 'No se pudieron cargar los items del reporte.');
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (selectedReportId) {
      void loadItems(selectedReportId);
    }
  }, [selectedReportId, loadItems]);

  async function handleImportSuccess(result: IpMcImportResult): Promise<void> {
    await loadReports();
    setSelectedReportId(result.reportId);
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-6">
      <header className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h1 className="text-2xl font-semibold text-slate-900">Admin · Mantenimiento IPMC</h1>
        <p className="mt-2 rounded bg-white px-3 py-2 text-sm text-blue-800">
          Fuente oficial: INE (PDF mensual)
        </p>
      </header>

      <IpMcUploadForm onImportSuccess={(result) => {
        void handleImportSuccess(result);
      }} />

      {pageError ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{pageError}</p> : null}

      {isLoadingReports ? <p className="text-sm text-slate-600">Cargando reportes...</p> : null}

      {!isLoadingReports ? (
        <IpMcReportsList
          reports={reports}
          selectedReportId={selectedReportId}
          latestReportId={latestReportId}
          onSelectReport={setSelectedReportId}
        />
      ) : null}

      <IpMcItemsTable items={items} isLoading={isLoadingItems} />
    </main>
  );
}
