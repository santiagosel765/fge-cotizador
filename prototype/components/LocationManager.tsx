
import React, { useEffect, useRef, useState } from 'react';
import MapPinIcon from './icons/MapPinIcon';

declare const L: any; // Declare Leaflet global

const LocationManager: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
        // Guatemala Coordinates
        const initialCoords: [number, number] = [15.7835, -90.2308];
        
        const map = L.map(mapContainerRef.current).setView(initialCoords, 7);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const marker = L.marker(initialCoords, { draggable: true }).addTo(map)
            .bindPopup('Ubicación del proyecto.');
        markerRef.current = marker;
    }
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
        setError('La geolocalización no es soportada por tu navegador.');
        return;
    }

    setError(null);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const newCoords: [number, number] = [latitude, longitude];
            if (mapRef.current) {
                mapRef.current.setView(newCoords, 15);
            }
            if (markerRef.current) {
                markerRef.current.setLatLng(newCoords).setPopupContent('Ubicación detectada.').openPopup();
            }
        },
        () => {
            setError('No se pudo acceder a tu ubicación. Por favor, habilita los permisos en tu navegador.');
        }
    );
  };


  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Ubicación del Proyecto</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="address-input" className="block text-sm font-medium text-slate-600 mb-1">
            Dirección (opcional)
          </label>
          <input
            id="address-input"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Ej: 1ra Calle 2-34 Zona 5, Quetzaltenango"
          />
        </div>
         <button
          type="button"
          onClick={handleDetectLocation}
          className="w-full bg-blue-100 text-blue-800 font-bold py-3 px-4 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 transition-colors"
        >
          <MapPinIcon className="w-5 h-5" />
          Detectar mi Ubicación
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div id="map" ref={mapContainerRef} className="h-64 rounded-lg z-0" aria-label="Mapa de ubicación del proyecto"></div>
      </div>
    </div>
  );
};

export default LocationManager;
