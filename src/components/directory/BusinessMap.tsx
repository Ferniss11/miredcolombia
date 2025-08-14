'use client'

import React from 'react'
import { GoogleMap, MarkerF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface BusinessMapProps {
    center: {
        lat: number;
        lng: number;
    };
    name: string;
    isMapsApiLoaded: boolean; // Recibe el estado de carga como prop
}

const BusinessMap = ({ center, name, isMapsApiLoaded }: BusinessMapProps) => {
  // Ya no se llama a useJsApiLoader aquí

  return isMapsApiLoaded ? (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
      >
        <MarkerF
          position={center}
          title={name}
        />
      </GoogleMap>
  ) : <div className="w-full h-full bg-muted animate-pulse" /> // Muestra un esqueleto mientras carga
}

export default React.memo(BusinessMap);
