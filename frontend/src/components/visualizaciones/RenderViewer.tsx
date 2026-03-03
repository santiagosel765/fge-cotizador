'use client';

interface RenderViewerProps {
  imageUrl: string;
  isLoading?: boolean;
  error?: string;
}

export function RenderViewer({ imageUrl, isLoading, error }: RenderViewerProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Generando render fotorrealista...</p>
          <p className="text-xs text-gray-400 mt-1">Esto puede tomar 30-60 segundos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <span className="text-4xl mb-3">🏠</span>
        <p className="text-sm text-gray-500">Haz clic en &quot;Generar Render&quot; para crear la imagen</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-black">
      <img
        src={imageUrl}
        alt="Render fotorrealista del proyecto"
        className="w-full object-contain max-h-[500px]"
      />
      <a
        href={imageUrl}
        download="render-proyecto.png"
        className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-800 text-xs px-3 py-1.5 rounded-full shadow transition-all flex items-center gap-1"
      >
        ⬇ Descargar
      </a>
    </div>
  );
}
