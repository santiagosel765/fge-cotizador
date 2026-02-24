'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

interface Props {
  latitude?: number;
  longitude?: number;
  addressText?: string;
  onLocationChange: (lat: number, lng: number, addressText?: string) => void;
}

export default function MapSection({ latitude, longitude, addressText, onLocationChange }: Props) {
  const [address, setAddress] = useState(addressText ?? '');
  const [error, setError] = useState('');

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setError('La geolocalización no es soportada por tu navegador.');
      return;
    }

    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onLocationChange(coords.latitude, coords.longitude, address);
      },
      () => {
        setError('No se pudo acceder a tu ubicación. Revisa permisos del navegador.');
      }
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Ubicación del Proyecto</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Dirección</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={() => {
              if (typeof latitude === 'number' && typeof longitude === 'number') {
                onLocationChange(latitude, longitude, address);
              }
            }}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Ej: 1ra Calle 2-34 Zona 5, Quetzaltenango"
          />
        </div>

        <button
          type="button"
          onClick={handleDetectLocation}
          className="w-full bg-blue-100 text-blue-800 font-bold py-3 px-4 rounded-lg hover:bg-blue-200 transition-colors"
        >
          Detectar mi Ubicación
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <LeafletMap
          latitude={latitude}
          longitude={longitude}
          onLocationChange={(lat, lng) => onLocationChange(lat, lng, address)}
        />
      </div>
    </div>
  );
}
