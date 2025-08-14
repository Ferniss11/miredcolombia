// src/components/inmobiliaria/LocationPickerModal.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import AddressAutocompleteInput from './AddressAutocompleteInput';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

interface LocationPickerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (address: string, location: { lat: number, lng: number }) => void;
  isMapsApiLoaded: boolean;
  initialLocation: { lat: number; lng: number };
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onOpenChange,
  onLocationSelect,
  isMapsApiLoaded,
  initialLocation,
}) => {
  const [selectedPlace, setSelectedPlace] = useState<{
    address: string;
    location: { lat: number; lng: number };
  } | null>(null);

  const [mapCenter, setMapCenter] = useState(initialLocation);

  const handlePlaceSelect = useCallback((address: string, location: { lat: number; lng: number }) => {
    setSelectedPlace({ address, location });
    setMapCenter(location);
  }, []);
  
  const handleConfirm = () => {
    if (selectedPlace) {
      onLocationSelect(selectedPlace.address, selectedPlace.location);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[625px]"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Seleccionar Ubicación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <AddressAutocompleteInput
            onPlaceSelect={handlePlaceSelect}
            isMapsApiLoaded={isMapsApiLoaded}
          />
          <div className="w-full h-[400px] rounded-md overflow-hidden bg-muted">
            {isMapsApiLoaded && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={15}
              >
                {selectedPlace && <MarkerF position={selectedPlace.location} />}
              </GoogleMap>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selectedPlace}>
            Confirmar Ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerModal;
