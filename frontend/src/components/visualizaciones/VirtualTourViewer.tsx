'use client';

import dynamic from 'next/dynamic';

const AFrameModule = dynamic(() => import('aframe').then(() => Promise.resolve(() => null)), { ssr: false });

export function VirtualTourViewer(): JSX.Element {
  return (
    <div>
      <AFrameModule />
      {/* TODO: implementar visor 360 con escena A-Frame */}
      VirtualTourViewer pendiente
    </div>
  );
}
