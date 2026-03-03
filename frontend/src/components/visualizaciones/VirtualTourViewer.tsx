'use client';

import { useState } from 'react';

interface VirtualTourViewerProps {
  imageUrl: string;
  isLoading?: boolean;
  error?: string;
}

export function VirtualTourViewer({ imageUrl, isLoading, error }: VirtualTourViewerProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - start.x;
    const newY = e.clientY - start.y;
    setOffset({ x: newX, y: Math.max(-100, Math.min(100, newY)) });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    setStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    const newX = touch.clientX - start.x;
    const newY = touch.clientY - start.y;
    setOffset({ x: newX, y: Math.max(-100, Math.min(100, newY)) });
  };

  const stopDragging = () => setIsDragging(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-900 rounded-lg">
        <div className="text-center text-white">
          <div className="animate-spin w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Generando Tour Virtual 360°...</p>
          <p className="text-xs text-gray-400 mt-1">Esto puede tomar 30-60 segundos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-900 rounded-lg border border-red-500">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-gray-900 rounded-lg border-2 border-dashed border-gray-600">
        <span className="text-5xl mb-3">🌐</span>
        <p className="text-sm text-gray-400">
          Haz clic en &quot;Generar Tour 360°&quot; para crear la visualización
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-900 select-none" style={{ height: '400px' }}>
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
        🖱 Arrastra para explorar el espacio
      </div>

      <div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDragging}
      >
        <img
          src={imageUrl}
          alt="Tour virtual 360°"
          draggable={false}
          style={{
            width: '200%',
            height: '120%',
            objectFit: 'cover',
            transform: `translateX(calc(${offset.x}px - 25%)) translateY(${offset.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        />
      </div>

      <a
        href={imageUrl}
        download="tour-360-proyecto.png"
        className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-800 text-xs px-3 py-1.5 rounded-full shadow transition-all flex items-center gap-1 z-10"
      >
        ⬇ Descargar
      </a>
    </div>
  );
}
