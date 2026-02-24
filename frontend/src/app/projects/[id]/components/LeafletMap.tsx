'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

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

function RecenterMap({ latitude, longitude }: { latitude?: number; longitude?: number }) {
  const map = useMapEvents({});

  useEffect(() => {
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      map.setView([latitude, longitude], 14);
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function LeafletMap({ latitude, longitude, onLocationChange }: Props) {
  const center: [number, number] =
    typeof latitude === 'number' && typeof longitude === 'number'
      ? [latitude, longitude]
      : [14.6349, -90.5069];

  return (
    <MapContainer center={center} zoom={10} className="h-72 w-full rounded-lg z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onLocationChange={onLocationChange} />
      <RecenterMap latitude={latitude} longitude={longitude} />
      {typeof latitude === 'number' && typeof longitude === 'number' && (
        <Marker position={[latitude, longitude]} />
      )}
    </MapContainer>
  );
}
