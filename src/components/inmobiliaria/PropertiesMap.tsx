// src/components/inmobiliaria/PropertiesMap.tsx
'use client';

import React from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import type { Property } from '@/lib/real-estate/domain/property.entity';

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface PropertiesMapProps {
    properties: Property[];
    highlightedPropertyId: string | null;
    onMarkerHover: (propertyId: string | null) => void;
    isMapsApiLoaded: boolean; // Receive loader status as a prop
}

const PropertiesMap = ({ properties, highlightedPropertyId, onMarkerHover, isMapsApiLoaded }: PropertiesMapProps) => {
    // We no longer need useJsApiLoader here, as it's centralized.

    // Default center to Madrid if no properties are available
    const mapCenter = properties.length > 0
        ? properties[0].location
        : { lat: 40.416775, lng: -3.703790 };

    if (!isMapsApiLoaded) {
        return <div className="w-full h-full bg-muted animate-pulse" />;
    }

    return (
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
    );
};

export default React.memo(PropertiesMap);
