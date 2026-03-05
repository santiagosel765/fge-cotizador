'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { LayoutDashboard, LogOut, UserCircle, Plus, LogIn } from 'lucide-react';

export default function HomePage(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900
    text-white shadow-md">
        {/* Topbar de sesión */}
        <div className="border-b border-blue-600/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-11">
              <span className="text-xs text-blue-300">
                Fundación Génesis Empresarial
              </span>
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <UserCircle size={15} className="text-blue-300" />
                    <span className="text-xs text-blue-200">
                      {user.fullName}
                    </span>
                    {(user.role === 'admin' ||
                user.role === 'advisor') && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-1.5 text-xs
                      bg-white/10 hover:bg-white/20 px-2.5 py-1
                      rounded-md transition-colors ml-1"
                      >
                        <LayoutDashboard size={13} />
                        Panel Admin
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center gap-1.5 text-xs
                    text-blue-300 hover:text-white
                    transition-colors ml-1"
                    >
                      <LogOut size={13} />
                      Salir
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 text-xs
                  bg-white/10 hover:bg-white/20 px-2.5 py-1
                  rounded-md transition-colors"
                  >
                    <LogIn size={13} />
                    Administración
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8
      py-14 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Cotizador de Construcción
          </h1>
          <p className="mt-2 text-lg text-blue-200 max-w-2xl mx-auto">
            Génesis Empresarial — Planifica, visualiza y presupuesta
            tu proyecto con inteligencia artificial
          </p>
          <Link
            href="/projects/new"
            className="mt-8 inline-flex items-center gap-2 rounded-lg
          bg-white text-blue-700 px-8 py-3 text-base font-bold
          shadow-lg hover:bg-blue-50 transition-colors"
          >
            <Plus size={18} />
            Crear nuevo proyecto
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800">Planifica, cotiza y construye con confianza</h2>
          <p className="mt-3 text-slate-600">
            Comienza creando tu proyecto. Después podrás generar un plan con IA, construir
            tu cotización, definir la ubicación en mapa y exportar tu información.
          </p>
        </div>
      </main>
    </div>
  );
}
