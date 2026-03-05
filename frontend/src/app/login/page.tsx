'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'client') {
        router.replace('/projects/new');
      } else {
        router.replace('/admin');
      }
    }
  }, [isLoading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const authUser = await login(email, password);
      if (authUser.role === 'client') {
        router.push('/projects/new');
      } else {
        router.push('/admin');
      }
    } catch {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-700 to-blue-900 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-center text-3xl font-extrabold text-slate-900">FGE Cotizador</h1>
        <p className="mt-2 text-center text-sm text-slate-500">Sistema de administración</p>

        <form className="mt-8 space-y-4" onSubmit={(event) => { void handleSubmit(event); }}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-700">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => { setPassword(event.target.value); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-20 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => { setShowPassword((prev) => !prev); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <Link href="/" className="mt-6 inline-block text-sm font-medium text-blue-700 hover:text-blue-600">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
