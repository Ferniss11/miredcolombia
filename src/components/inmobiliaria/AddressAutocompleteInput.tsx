// src/components/inmobiliaria/AddressAutocompleteInput.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface AddressAutocompleteInputProps {
  onAddressSelect: (address: string, location: { lat: number; lng: number; }) => void;
  value: string;
  onChange: (value: string) => void;
  isMapsApiLoaded: boolean;
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
    // Ensure the Google Maps script is loaded and the input ref is available.
    if (isMapsApiLoaded && inputRef.current && !autocompleteRef.current) {
      // Initialize the Autocomplete instance.
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: 'es' }, // Restrict to Spain
          fields: ['formatted_address', 'geometry'], // Request only needed fields
          types: ['address'],
        }
      );

      // Add listener for when the user selects a place.
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (place?.geometry?.location && place.formatted_address) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          // Update the form's state via the passed-in functions.
          onChange(place.formatted_address);
          onAddressSelect(place.formatted_address, location);
        }
      });
    }

    // Cleanup the listener when the component unmounts.
    return () => {
      if (autocompleteRef.current) {
        if (window.google && window.google.maps && window.google.maps.event) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      }
    };
  }, [isMapsApiLoaded, onChange, onAddressSelect]);

  if (!isMapsApiLoaded) {
      return <Input disabled placeholder="Cargando mapa..." />;
  }

  return (
    <Input
      ref={inputRef}
      placeholder="Empieza a escribir la dirección..."
      value={value || ''} // Ensure value is never null/undefined
      onChange={(e) => onChange(e.target.value)} // Propagate changes to react-hook-form
    />
  );
};

export default AddressAutocompleteInput;
