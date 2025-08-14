// src/components/inmobiliaria/PropertyListings.tsx
'use client';

import React, { useState, useMemo } from 'react';
import type { Property } from '@/lib/real-estate/domain/property.entity';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import PropertyCard from './PropertyCard';
import PropertiesMap from './PropertiesMap';

interface PropertyListingsProps {
    initialProperties: Property[];
    isMapsApiLoaded: boolean; // Receive loader status as a prop
}

export default function PropertyListings({ initialProperties, isMapsApiLoaded }: PropertyListingsProps) {
    const [properties, setProperties] = useState(initialProperties);
    const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

     const filteredProperties = useMemo(() => {
        if (!searchQuery) {
            return initialProperties;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return initialProperties.filter(p =>
            p.title.toLowerCase().includes(lowercasedQuery) ||
            p.address.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, initialProperties]);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-170px)]">
            {/* Left Column: Filters and List */}
            <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por título, dirección..."
                            className="w-full pl-10 py-3 text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Filter buttons will go here */}
                </div>
                <ScrollArea className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                        {filteredProperties.map(property => (
                            <PropertyCard 
                                key={property.id} 
                                property={property} 
                                isHighlighted={highlightedPropertyId === property.id}
                                onMouseEnter={() => setHighlightedPropertyId(property.id)}
                                onMouseLeave={() => setHighlightedPropertyId(null)}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Right Column: Map */}
            <div className="h-full hidden lg:block">
                <PropertiesMap 
                    properties={filteredProperties} 
                    highlightedPropertyId={highlightedPropertyId}
                    onMarkerHover={setHighlightedPropertyId}
                    isMapsApiLoaded={isMapsApiLoaded}
                />
            </div>
        </div>
    );
}
