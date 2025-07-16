'use client'

import React from 'react'
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

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
}

const BusinessMap = ({ center, name }: BusinessMapProps) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  })

  return isLoaded ? (
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
  ) : <></>
}

export default React.memo(BusinessMap);