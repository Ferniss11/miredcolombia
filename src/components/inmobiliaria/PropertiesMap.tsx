// src/components/inmobiliaria/PropertiesMap.tsx
'use client';

import React, { useMemo } from 'react';
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
    isMapsApiLoaded: boolean;
}

const PropertiesMap = ({ properties, highlightedPropertyId, onMarkerHover, isMapsApiLoaded }: PropertiesMapProps) => {

    const mapCenter = useMemo(() => {
        if (properties.length > 0) {
            // Calculate the average lat/lng to center the map
            const totalLat = properties.reduce((sum, p) => sum + p.location.lat, 0);
            const totalLng = properties.reduce((sum, p) => sum + p.location.lng, 0);
            return { lat: totalLat / properties.length, lng: totalLng / properties.length };
        }
        return { lat: 40.416775, lng: -3.703790 }; // Default to Madrid if no properties
    }, [properties]);
    
    // Adjust zoom level based on properties spread - a more advanced implementation
    // could calculate bounds, but for now a simple logic works.
    const zoomLevel = properties.length > 1 ? 10 : 12;

    if (!isMapsApiLoaded) {
        return <div className="w-full h-full bg-muted animate-pulse" />;
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={zoomLevel}
            options={{
                disableDefaultUI: true,
                zoomControl: true,
            }}
        >
            {properties.map(property => {
                const isHighlighted = property.id === highlightedPropertyId;
                return (
                    <MarkerF
                        key={property.id}
                        position={property.location}
                        title={property.title}
                        onMouseOver={() => onMarkerHover(property.id)}
                        onMouseOut={() => onMarkerHover(null)}
                        zIndex={isHighlighted ? 10 : 1}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: isHighlighted ? 10 : 6,
                            fillColor: isHighlighted ? "#FFC107" : "#003893",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "#FFFFFF",
                        }}
                    />
                );
            })}
        </GoogleMap>
    );
};

export default React.memo(PropertiesMap);
