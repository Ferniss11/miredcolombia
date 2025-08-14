// src/components/inmobiliaria/PropertiesMap.tsx
'use client';

import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import type { Property } from '@/lib/real-estate/domain/property.entity';

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface PropertiesMapProps {
    properties: Property[];
    highlightedPropertyId: string | null;
    onMarkerHover: (propertyId: string | null) => void;
}

const PropertiesMap = ({ properties, highlightedPropertyId, onMarkerHover }: PropertiesMapProps) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    });

    // Default center to Madrid if no properties are available
    const mapCenter = properties.length > 0
        ? properties[0].location
        : { lat: 40.416775, lng: -3.703790 };

    return isLoaded ? (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={12}
        >
            {properties.map(property => (
                <MarkerF
                    key={property.id}
                    position={property.location}
                    title={property.title}
                    onMouseOver={() => onMarkerHover(property.id)}
                    onMouseOut={() => onMarkerHover(null)}
                    // Custom marker logic will go here
                />
            ))}
        </GoogleMap>
    ) : <div className="w-full h-full bg-muted animate-pulse" />;
};

export default React.memo(PropertiesMap);
