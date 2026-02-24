// FIX: By importing 'react', we ensure that its global JSX type definitions are loaded.
// This allows the `declare global` block below to augment `JSX.IntrinsicElements`
// for A-Frame components, rather than overwriting the standard HTML and SVG element types.
import React from 'react';

export interface Material {
  id: string;
  name: string;
  unit: string;
  price: number; // Precio en Quetzales (GTQ)
}

export interface QuoteItem {
  material: Material;
  quantity: number;
}

// FIX: Added A-Frame type definitions for JSX to be globally available.
// This resolves errors related to custom A-Frame elements like <a-scene> in JSX.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-assets': any;
      'a-sky': any;
      'a-camera': any;
      // FIX: Add an index signature to allow all standard HTML and SVG elements.
      // This resolves the "Property '...' does not exist on type 'JSX.IntrinsicElements'"
      // error that was occurring for all standard JSX tags.
      [elem: string]: any;
    }
  }
}
