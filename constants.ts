import { Material } from './types';

export const MATERIALS_DB: Material[] = [
  // Obra Gris
  { id: 'cem-01', name: 'Bolsa de Cemento UGC 3000 PSI', unit: 'Bolsa 42.5kg', price: 85.00 },
  { id: 'hie-01', name: 'Quintal de Hierro Legítimo 3/8"', unit: 'Quintal', price: 450.00 },
  { id: 'hie-02', name: 'Quintal de Hierro Legítimo 1/2"', unit: 'Quintal', price: 780.00 },
  { id: 'hie-03', name: 'Quintal de Hierro Legítimo 1/4"', unit: 'Quintal', price: 210.00 },
  { id: 'blo-01', name: 'Block de 14x19x39 cm', unit: 'Unidad', price: 4.50 },
  { id: 'blo-02', name: 'Block de 19x19x39 cm', unit: 'Unidad', price: 6.00 },
  { id: 'lad-01', name: 'Ladrillo Tubular', unit: 'Unidad', price: 2.75 },
  { id: 'agr-01', name: 'Arena de Río', unit: 'Metro Cúbico', price: 200.00 },
  { id: 'agr-02', name: 'Piedrín', unit: 'Metro Cúbico', price: 225.00 },
  { id: 'lam-01', name: 'Lámina Troquelada 12 pies', unit: 'Unidad', price: 130.00 },
  { id: 'lam-02', name: 'Lámina Termoacústica 12 pies', unit: 'Unidad', price: 450.00 },
  { id: 'acb-01', name: 'Bolsa de Cal', unit: 'Bolsa 25kg', price: 35.00 },

  // Plomería y Drenajes (Tuberías)
  { id: 'pvc-01', name: 'Tubo PVC 4" para Drenaje', unit: 'Vara (6m)', price: 150.00 },
  { id: 'pvc-02', name: 'Tubo PVC 1/2" para Agua Potable', unit: 'Vara (6m)', price: 45.00 },
  { id: 'pvc-03', name: 'Tubo PVC 3/4" para Agua Potable', unit: 'Vara (6m)', price: 70.00 },
  { id: 'pvc-04', name: 'Codo PVC 1/2" 90° para Agua', unit: 'Unidad', price: 2.50 },
  { id: 'pvc-05', name: 'Codo PVC 3/4" 90° para Agua', unit: 'Unidad', price: 4.00 },
  { id: 'pvc-06', name: 'Te PVC 1/2" para Agua', unit: 'Unidad', price: 3.50 },
  { id: 'pvc-07', name: 'Te PVC 3/4" para Agua', unit: 'Unidad', price: 5.00 },
  { id: 'pvc-08', name: 'Adaptador Macho PVC 1/2"', unit: 'Unidad', price: 3.00 },
  { id: 'pvc-09', name: 'Adaptador Hembra PVC 1/2"', unit: 'Unidad', price: 3.00 },
  { id: 'pvc-10', name: 'Pegamento para PVC (1/4 galón)', unit: 'Unidad', price: 80.00 },
  { id: 'pvc-11', name: 'Limpiador para PVC (1/4 galón)', unit: 'Unidad', price: 65.00 },
  { id: 'pvc-12', name: 'Cinta Teflón', unit: 'Rollo', price: 5.00 },

  // Plomería (Acabados y Artefactos)
  { id: 'san-01', name: 'Inodoro estándar con tanque', unit: 'Juego', price: 850.00 },
  { id: 'san-02', name: 'Lavamanos de pedestal', unit: 'Juego', price: 450.00 },
  { id: 'san-03', name: 'Ducha completa (regadera y manerales)', unit: 'Juego', price: 375.00 },
  { id: 'san-04', name: 'Grifo de cocina monomando', unit: 'Unidad', price: 500.00 },
  
  // Electricidad (Canalización)
  { id: 'ele-01', name: 'Alambre de Amarre', unit: 'Libra', price: 12.00 },
  { id: 'ele-02', name: 'Caja de Alambre Eléctrico #12 (100m)', unit: 'Caja 100m', price: 450.00 },
  { id: 'ele-03', name: 'Caja de Alambre Eléctrico #14 (100m)', unit: 'Caja 100m', price: 350.00 },
  { id: 'ele-04', name: 'Rollo de Poliducto Naranja 1/2" (50m)', unit: 'Rollo 50m', price: 150.00 },
  { id: 'ele-05', name: 'Caja Rectangular Plástica 4x2"', unit: 'Unidad', price: 3.50 },
  { id: 'ele-06', name: 'Caja Octogonal Plástica 4x4"', unit: 'Unidad', price: 4.00 },
  { id: 'ele-12', name: 'Cinta de Aislar', unit: 'Rollo', price: 8.00 },

  // Electricidad (Acabados y Controles)
  { id: 'ele-07', name: 'Tomacorriente Doble con Placa', unit: 'Unidad', price: 25.00 },
  { id: 'ele-13', name: 'Tomacorriente 220V para Ducha/Estufa', unit: 'Unidad', price: 60.00 },
  { id: 'ele-08', name: 'Interruptor Sencillo con Placa', unit: 'Unidad', price: 20.00 },
  { id: 'ele-09', name: 'Plafonera de Baquelita', unit: 'Unidad', price: 10.00 },
  { id: 'ele-14', name: 'Lámpara LED de Techo 18W', unit: 'Unidad', price: 120.00 },
  { id: 'ele-15', name: 'Bombillo LED 9W', unit: 'Unidad', price: 25.00 },
  { id: 'ele-10', name: 'Flipón (Breaker) 15A', unit: 'Unidad', price: 45.00 },
  { id: 'ele-11', name: 'Flipón (Breaker) 20A', unit: 'Unidad', price: 45.00 },
  { id: 'ele-16', name: 'Centro de Carga para 4 flipones', unit: 'Unidad', price: 150.00 },
  
  // Acabados Generales
  { id: 'pin-01', name: 'Galón de Pintura de Hule (Blanca)', unit: 'Galón', price: 125.00 },
  { id: 'pin-02', name: 'Cubeta de Pintura de Hule (Blanca)', unit: 'Cubeta 5gl', price: 550.00 },

  // Ventanas y Puertas
  { id: 'ven-01', name: 'Ventana de aluminio y vidrio 1.00x1.00m', unit: 'Unidad', price: 550.00 },
  { id: 'ven-02', name: 'Ventana de aluminio y vidrio 1.50x1.20m', unit: 'Unidad', price: 800.00 },
  { id: 'ven-03', name: 'Ventana de baño (celosía) 0.60x0.40m', unit: 'Unidad', price: 350.00 },
  { id: 'pue-01', name: 'Puerta interior de MDF con chapa', unit: 'Juego', price: 600.00 },
  { id: 'pue-02', name: 'Puerta exterior de metal con chapa', unit: 'Juego', price: 1200.00 },
];

export const IVA_RATE = 0.12; // 12% IVA en Guatemala
