'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import {
  Users,
  BarChart2,
  HardHat,
  FolderOpen,
  LogOut,
  Home,
  PlusCircle,
} from 'lucide-react';

const navItems = [
  { href: '/admin/users', label: 'Usuarios', Icon: Users },
  { href: '/admin/ipmc', label: 'IPMC INE', Icon: BarChart2 },
  { href: '/admin/labor', label: 'Mano de Obra', Icon: HardHat },
  { href: '/admin/projects', label: 'Proyectos', Icon: FolderOpen },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!token || !user
        || (user.role !== 'admin' && user.role !== 'advisor')) {
      router.replace('/login');
    }
  }, [isLoading, token, user, router]);

  if (isLoading || !token || !user
      || (user.role !== 'admin' && user.role !== 'advisor')) {
    return (
      <div className="flex min-h-screen items-center justify-center
          bg-slate-100 text-slate-700">
        Validando sesión...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 flex h-screen w-60
          flex-col bg-slate-900 text-white">

        {/* Logo */}
        <div className="border-b border-slate-700 px-5 py-5">
          <p className="text-xs uppercase tracking-widest
              text-slate-400 mb-1">Fundación Génesis</p>
          <h1 className="text-xl font-extrabold text-white">
            FGE Cotizador
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Panel de administración
          </p>
        </div>

        {/* Accesos rápidos */}
        <div className="px-3 pt-4 pb-2 border-b border-slate-700">
          <p className="text-xs uppercase tracking-widest
              text-slate-500 px-3 mb-2">Acceso rápido</p>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2
                text-sm text-slate-300 hover:bg-slate-700
                hover:text-white transition-colors"
          >
            <Home size={16} />
            <span>Inicio</span>
          </Link>
          <Link
            href="/projects/new"
            className="flex items-center gap-3 rounded-md px-3 py-2
                text-sm text-slate-300 hover:bg-slate-700
                hover:text-white transition-colors"
          >
            <PlusCircle size={16} />
            <span>Nuevo Proyecto</span>
          </Link>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          <p className="text-xs uppercase tracking-widest
              text-slate-500 px-3 mb-2">Administración</p>
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href
                || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3
                    py-2.5 text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="border-t border-slate-700 px-3 py-3">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold text-white">
              {user.fullName}
            </p>
            <p className="text-xs capitalize text-slate-400">
              {user.role}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 w-full rounded-md px-3
                py-2 text-sm text-slate-300 hover:bg-red-600
                hover:text-white transition-colors"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="ml-60 min-h-screen">{children}</div>
    </div>
  );
}
