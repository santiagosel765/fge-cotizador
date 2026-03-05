'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ipmcService } from '@/services/ipmc.service';
import { usersService } from '@/services/users.service';

interface StatCardProps {
  title: string;
  value: string;
  accent: string;
  description: string;
}

function StatCard({ title, value, accent, description }: Readonly<StatCardProps>): JSX.Element {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-500">{title}</h2>
      <p className={`mt-3 text-3xl font-extrabold ${accent}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </article>
  );
}

export default function AdminDashboardPage(): JSX.Element {
  const { token } = useAuth();
  const [usersCount, setUsersCount] = useState<string>('...');
  const [latestIpmc, setLatestIpmc] = useState<string>('...');

  useEffect(() => {
    if (!token) {
      return;
    }
    const safeToken = token;

    async function loadStats(): Promise<void> {
      try {
        const users = await usersService.listUsers(undefined, safeToken);
        setUsersCount(String(users.length));
      } catch {
        setUsersCount('N/D');
      }

      try {
        const report = await ipmcService.getLatestReport(safeToken);
        setLatestIpmc(`${String(report.month).padStart(2, '0')}/${report.year}`);
      } catch {
        setLatestIpmc('Sin datos');
      }
    }

    void loadStats();
  }, [token]);

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Panel de Administración</h1>
        <p className="text-slate-600">Resumen general del sistema.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Usuarios"
          value={usersCount}
          accent="text-blue-700"
          description="Usuarios registrados en el sistema"
        />
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500">Proyectos activos</h2>
          <p className="mt-3 text-3xl font-extrabold text-emerald-700">--</p>
          <Link href="/" className="mt-2 inline-block text-sm text-emerald-700 hover:underline">
            Ver proyectos
          </Link>
        </article>
        <StatCard
          title="IPMC actual"
          value={latestIpmc}
          accent="text-violet-700"
          description="Último reporte de IPMC disponible"
        />
        <StatCard
          title="Créditos pendientes"
          value="--"
          accent="text-amber-700"
          description="Pendiente de integrar"
        />
      </section>
    </main>
  );
}
