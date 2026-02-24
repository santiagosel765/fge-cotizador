import Link from 'next/link';

export default function HomePage(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">FGE Cotizador</h1>
      <p className="text-lg text-slate-600">Monorepo inicial para backend NestJS y frontend Next.js.</p>
      <Link className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white" href="/projects/new">
        Crear nuevo proyecto
      </Link>
    </main>
  );
}
