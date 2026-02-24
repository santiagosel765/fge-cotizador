'use client';

import dynamic from 'next/dynamic';

const LeafletModule = dynamic(() => import('leaflet').then(() => Promise.resolve(() => null)), { ssr: false });

export function LocationPicker(): JSX.Element {
  return (
    <div>
      <LeafletModule />
      {/* TODO: implementar mapa interactivo con react-leaflet y selección de coordenadas */}
      LocationPicker pendiente
    </div>
  );
}
