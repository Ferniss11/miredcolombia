// src/components/inmobiliaria/AddressAutocompleteInput.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
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
  const placeChangedListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  useEffect(() => {
    if (!isMapsApiLoaded || !inputRef.current) {
      return;
    }

    // Initialize the Autocomplete instance
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'es' },
        fields: ['formatted_address', 'geometry'],
        types: ['address'],
      }
    );

    // --- Solution for the selection issue ---
    // The .pac-container is what holds the suggestions. We check when it's added/removed.
    const pacContainer = document.querySelector('.pac-container');
    const observer = new MutationObserver(() => {
        const isVisible = document.querySelector('.pac-container') && !document.querySelector('.pac-container')?.classList.contains('pac-logo');
        if (isVisible) {
            document.body.classList.add('pac-container-visible');
        } else {
            document.body.classList.remove('pac-container-visible');
        }
    });

    if (pacContainer) {
       observer.observe(pacContainer.parentElement!, {
            childList: true,
            subtree: true,
        });
    }
    // --- End of solution ---

    // Add listener for when the user selects a place
    placeChangedListenerRef.current = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (place?.geometry?.location && place.formatted_address) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        onChange(place.formatted_address);
        onAddressSelect(place.formatted_address, location);
      }
    });

    // Cleanup function
    return () => {
        observer.disconnect();
        document.body.classList.remove('pac-container-visible');
        if (placeChangedListenerRef.current) {
            placeChangedListenerRef.current.remove();
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
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default AddressAutocompleteInput;