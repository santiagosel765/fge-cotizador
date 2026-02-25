'use client';
import { useEffect, useRef } from 'react';
import type { Map as LeafletMapInstance } from 'leaflet';

interface Props {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LeafletMap({ latitude, longitude, onLocationChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<ReturnType<typeof import('leaflet')['marker']> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Evitar doble inicialización (StrictMode)
    if (mapRef.current) return;

    // Import dinámico de Leaflet
    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // Fix iconos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialCenter: [number, number] =
        typeof latitude === 'number' && typeof longitude === 'number'
          ? [latitude, longitude]
          : [14.6349, -90.5069];

      const map = L.map(containerRef.current).setView(initialCenter, 10);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Marcador inicial si hay coordenadas
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        markerRef.current = L.marker([latitude, longitude]).addTo(map);
      }

      // Click para seleccionar ubicación
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }

        onLocationChange(lat, lng);
      });
    });

    // Cleanup al desmontar
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Solo ejecutar una vez al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar marcador cuando cambian las props lat/lng externamente
  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

    import('leaflet').then((L) => {
      if (!mapRef.current) return;
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current!);
      }
      mapRef.current.setView([latitude, longitude], 14);
    });
  }, [latitude, longitude]);

  return (
    <>
      {/* CSS de Leaflet — inline para evitar problemas de import en componente client */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={containerRef}
        className="h-72 w-full rounded-lg z-0"
        style={{ minHeight: '288px' }}
      />
    </>
  );
}
