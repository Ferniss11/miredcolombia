// src/components/inmobiliaria/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel } from '@/components/ui/form';

const libraries = ['places'] as any;

interface AddressAutocompleteInputProps {
  onAddressSelect: (address: string, location: { lat: number; lng: number; }) => void;
  initialValue?: string;
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({ onAddressSelect, initialValue = '' }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const [inputValue, setInputValue] = useState(initialValue);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && inputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: 'es' }, // Restrict to Spain
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
          onAddressSelect(place.formatted_address, location);
          setInputValue(place.formatted_address);
        }
      });
    }
  }, [isLoaded, onAddressSelect]);
  
  if (!isLoaded) return <Input disabled placeholder="Cargando mapa..." />;

  return (
    <FormItem>
        <FormLabel>Dirección</FormLabel>
        <Input
            ref={inputRef}
            placeholder="Empieza a escribir la dirección..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
        />
    </FormItem>
  );
};

export default AddressAutocompleteInput;
