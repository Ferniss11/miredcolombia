// src/components/inmobiliaria/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
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

  const [inputValue, setInputValue] = useState(value || '');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Sync internal state with form value from react-hook-form
  useEffect(() => {
    // Only update if the parent form value is different to prevent loops
    if (value !== inputValue) {
        setInputValue(value || '');
    }
  }, [value, inputValue]);

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
          // Update both the visual input and the form state
          setInputValue(place.formatted_address);
          onChange(place.formatted_address); // Update react-hook-form
          onAddressSelect(place.formatted_address, location); // Update coordinates
        }
      });
    }
    // Clean up the event listener when the component unmounts
    return () => {
        if (autocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
    }
  }, [isLoaded, onAddressSelect, onChange]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value); // Propagate change to react-hook-form
  }

  if (!isLoaded) return <Input disabled placeholder="Cargando mapa..." />;

  return (
    <Input
        ref={inputRef}
        placeholder="Empieza a escribir la dirección..."
        value={inputValue}
        onChange={handleInputChange}
    />
  );
};

export default AddressAutocompleteInput;