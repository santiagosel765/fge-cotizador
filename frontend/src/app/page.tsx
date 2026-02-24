import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">FGE Cotizador</h1>
          <p className="text-lg text-gray-600">
            Cotizador de construcción — Fundación Génesis Empresarial
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
          <p className="text-gray-700">
            Describe tu proyecto de construcción y obtén una cotización
            detallada con materiales, plano arquitectónico y opciones de crédito.
          </p>
          <Link
            href="/projects/new"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Crear nuevo proyecto
          </Link>
        </div>
      </div>
    </main>
  );
}
