
'use client';

import { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ServiceCard from './ServiceCard';
import type { ServiceListing } from '@/lib/types';

interface ServiceListProps {
    initialListings: ServiceListing[];
}

export default function ServiceList({ initialListings }: ServiceListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredListings = useMemo(() => {
        if (!searchQuery) {
            return initialListings;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return initialListings.filter(listing =>
            listing.title.toLowerCase().includes(lowercasedQuery) ||
            listing.description.toLowerCase().includes(lowercasedQuery) ||
            listing.category.toLowerCase().includes(lowercasedQuery) ||
            listing.city.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, initialListings]);

    return (
        <>
            <div className="max-w-2xl mx-auto mb-12">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por servicio, categoría o ciudad..."
                        className="w-full pl-10 py-3 text-base"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredListings.map(listing => (
                        <ServiceCard key={listing.id} listing={listing} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                    <h2 className="text-2xl font-semibold">No se encontraron servicios</h2>
                    <p className="mt-1 text-sm">Prueba con otros términos de búsqueda.</p>
                </div>
            )}
        </>
    );
}
