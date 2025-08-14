// src/components/inmobiliaria/AddressAutocompleteInput.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface AddressAutocompleteInputProps {
  onPlaceSelect: (address: string, location: { lat: number; lng: number; }) => void;
  isMapsApiLoaded: boolean;
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({ 
  onPlaceSelect,
  isMapsApiLoaded 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isMapsApiLoaded || !inputRef.current || !window.google) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'es' },
        fields: ['formatted_address', 'geometry'],
        types: ['address'],
      }
    );

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place?.geometry?.location && place.formatted_address) {
        onPlaceSelect(place.formatted_address, place.geometry.location.toJSON());
      }
    });

    return () => {
      listener.remove();
      // Clean up the autocomplete instance and its container from the DOM
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => container.remove());
    };
  }, [isMapsApiLoaded, onPlaceSelect]);

  if (!isMapsApiLoaded) {
      return <Input disabled placeholder="Cargando mapa..." />;
  }

  return (
    <Input
      ref={inputRef}
      placeholder="Busca una dirección..."
      type="text"
    />
  );
};

export default AddressAutocompleteInput;
