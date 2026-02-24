'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMapType } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix iconos Leaflet con Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMap({ latitude, longitude, onLocationChange }: Props) {
  const mapRef = useRef<LeafletMapType | null>(null);

  useEffect(() => {
    if (
      mapRef.current &&
      typeof latitude === 'number' &&
      typeof longitude === 'number'
    ) {
      mapRef.current.setView([latitude, longitude], 14);
    }
  }, [latitude, longitude]);

  const center: [number, number] =
    typeof latitude === 'number' && typeof longitude === 'number'
      ? [latitude, longitude]
      : [14.6349, -90.5069];

  return (
    <MapContainer
      center={center}
      zoom={10}
      className="h-72 w-full rounded-lg z-0"
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onLocationChange={onLocationChange} />
      {typeof latitude === 'number' && typeof longitude === 'number' && (
        <Marker position={[latitude, longitude]} />
      )}
    </MapContainer>
  );
}
