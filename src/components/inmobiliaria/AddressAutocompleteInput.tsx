// src/components/inmobiliaria/AddressAutocompleteInput.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';

const libraries = ['places', 'maps'] as any;

interface AddressAutocompleteInputProps {
  onAddressSelect: (address: string, location: { lat: number; lng: number; }) => void;
  value: string;
  onChange: (value: string) => void;
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({ onAddressSelect, value, onChange }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: 'es' },
          fields: ['address_components', 'geometry', 'icon', 'name', 'formatted_address'],
          types: ['address'],
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.geometry && place.geometry.location && place.formatted_address) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          onChange(place.formatted_address); // Update react-hook-form's value
          onAddressSelect(place.formatted_address, location); // Update coordinates in form
        }
      });
    }
    
    // Cleanup listener on unmount
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  // We only want this effect to run once when the component is loaded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  if (!isLoaded) return <Input disabled placeholder="Cargando mapa..." />;

  return (
    <Input
        ref={inputRef}
        placeholder="Empieza a escribir la dirección..."
        value={value || ''} // Ensure value is always a string
        onChange={(e) => onChange(e.target.value)} // Directly call onChange from props
    />
  );
};

export default AddressAutocompleteInput;