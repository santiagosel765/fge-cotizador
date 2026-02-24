import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Cotizador de Construcción Génesis Empresarial
          </h1>
          <p className="mt-3 text-lg text-blue-200 max-w-3xl mx-auto">
            La herramienta IA de Génesis Empresarial para planificar tus proyectos,
            visualizar tu obra y estimar costos de materiales.
          </p>
          <Link
            href="/projects/new"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-indigo-400"
          >
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
