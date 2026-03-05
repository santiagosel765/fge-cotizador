'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/admin/users', label: '👥 Usuarios' },
  { href: '/admin/ipmc', label: '📊 IPMC INE' },
  { href: '/admin/labor', label: '👷 Mano de Obra' },
  { href: '/admin/projects', label: '🏗️ Proyectos' },
];

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!token || !user || (user.role !== 'admin' && user.role !== 'advisor')) {
      router.replace('/login');
    }
  }, [isLoading, token, user, router]);

  if (isLoading || !token || !user || (user.role !== 'admin' && user.role !== 'advisor')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
        Validando sesión...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col bg-slate-800 text-white">
        <div className="border-b border-slate-700 px-5 py-6">
          <p className="text-xs uppercase tracking-widest text-slate-300">FGE</p>
          <h1 className="text-2xl font-extrabold">Cotizador</h1>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-slate-600 text-white' : 'text-slate-200 hover:bg-slate-700'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            🔒 Cerrar sesión
          </button>
        </nav>

        <div className="border-t border-slate-700 px-4 py-4 text-sm">
          <p className="font-semibold">{user.fullName}</p>
          <p className="capitalize text-slate-300">{user.role}</p>
        </div>
      </aside>

      <div className="ml-60 min-h-screen p-6">{children}</div>
    </div>
  );
}
