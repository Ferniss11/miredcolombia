// src/components/inmobiliaria/AddressAutocompleteInput.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface AddressAutocompleteInputProps {
  onAddressSelect: (address: string, location: { lat: number; lng: number; }) => void;
  value: string;
  onChange: (value: string) => void;
  isMapsApiLoaded: boolean; // Receive loader status as a prop
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({ 
  onAddressSelect, 
  value, 
  onChange,
  isMapsApiLoaded 
}) => {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMapsApiLoaded && inputRef.current && !autocompleteRef.current) {
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
        // Using a check to prevent errors if the google object is not available during cleanup
        if (window.google && window.google.maps && window.google.maps.event) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      }
    };
  }, [isMapsApiLoaded, onChange, onAddressSelect]);

  if (!isMapsApiLoaded) return <Input disabled placeholder="Cargando mapa..." />;

  return (
    <Input
        ref={inputRef}
        placeholder="Empieza a escribir la dirección..."
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default AddressAutocompleteInput;
