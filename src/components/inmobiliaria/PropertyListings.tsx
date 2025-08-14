// src/components/inmobiliaria/PropertyListings.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { Property } from '@/lib/real-estate/domain/property.entity';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, BedDouble, Bath, Euro } from 'lucide-react';
import PropertyCard from './PropertyCard';
import PropertiesMap from './PropertiesMap';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';


interface PropertyListingsProps {
    initialProperties: Property[];
    isMapsApiLoaded: boolean;
}

const MAX_PRICE = 5000;

export default function PropertyListings({ initialProperties, isMapsApiLoaded }: PropertyListingsProps) {
    const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [listingType, setListingType] = useState<'rent' | 'sale' | 'all'>('all');
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
    const [bedrooms, setBedrooms] = useState(0);
    const [bathrooms, setBathrooms] = useState(0);

    const filteredProperties = useMemo(() => {
        return initialProperties.filter(p => {
            const searchMatch = searchQuery === '' || 
                                p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                p.address.toLowerCase().includes(searchQuery.toLowerCase());
            
            const listingTypeMatch = listingType === 'all' || p.listingType === listingType;
            
            const propertyTypeMatch = propertyTypes.length === 0 || propertyTypes.includes(p.propertyType);
            
            const priceMatch = p.price >= priceRange[0] && (priceRange[1] === MAX_PRICE ? true : p.price <= priceRange[1]);
            
            const bedroomsMatch = bedrooms === 0 || p.bedrooms >= bedrooms;
            
            const bathroomsMatch = bathrooms === 0 || p.bathrooms >= bathrooms;

            return searchMatch && listingTypeMatch && propertyTypeMatch && priceMatch && bedroomsMatch && bathroomsMatch;
        });
    }, [initialProperties, searchQuery, listingType, propertyTypes, priceRange, bedrooms, bathrooms]);
    
    const handleResetFilters = () => {
        setPriceRange([0, MAX_PRICE]);
        setBedrooms(0);
        setBathrooms(0);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-170px)]">
            {/* Left Column: Filters and List */}
            <div className="flex flex-col h-full">
                <div className="p-4 border-b space-y-4">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por título, dirección..."
                            className="w-full pl-10 py-2 h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                         <ToggleGroup type="single" defaultValue="all" value={listingType} onValueChange={(value: 'rent' | 'sale' | 'all') => value && setListingType(value)}>
                            <ToggleGroupItem value="all">Todo</ToggleGroupItem>
                            <ToggleGroupItem value="rent">Alquiler</ToggleGroupItem>
                            <ToggleGroupItem value="sale">Venta</ToggleGroupItem>
                        </ToggleGroup>
                         <ToggleGroup type="multiple" value={propertyTypes} onValueChange={setPropertyTypes} className="hidden sm:flex">
                            <ToggleGroupItem value="apartment">Apartamento</ToggleGroupItem>
                            <ToggleGroupItem value="house">Casa</ToggleGroupItem>
                            <ToggleGroupItem value="room">Habitación</ToggleGroupItem>
                        </ToggleGroup>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="ml-auto">
                                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                                    Más filtros
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Filtros Avanzados</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Ajusta los detalles de tu búsqueda.
                                        </p>
                                    </div>
                                    <div className="grid gap-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="price-range" className="flex items-center gap-2">
                                                <Euro className="h-4 w-4"/> Rango de Precios
                                            </Label>
                                            <Slider
                                                id="price-range"
                                                min={0}
                                                max={MAX_PRICE}
                                                step={100}
                                                value={priceRange}
                                                onValueChange={(value) => setPriceRange(value as [number, number])}
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{priceRange[0]}€</span>
                                                <span>{priceRange[1] === MAX_PRICE ? `${MAX_PRICE}€+` : `${priceRange[1]}€`}</span>
                                            </div>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="bedrooms" className="flex items-center gap-2">
                                                <BedDouble className="h-4 w-4"/> Habitaciones
                                            </Label>
                                            <Slider
                                                id="bedrooms"
                                                min={0}
                                                max={5}
                                                step={1}
                                                value={[bedrooms]}
                                                onValueChange={(value) => setBedrooms(value[0])}
                                            />
                                             <div className="text-center text-xs text-muted-foreground">{bedrooms === 0 ? 'Cualquiera' : `${bedrooms}+`}</div>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="bathrooms" className="flex items-center gap-2">
                                                <Bath className="h-4 w-4"/> Baños
                                            </Label>
                                            <Slider
                                                id="bathrooms"
                                                min={0}
                                                max={5}
                                                step={1}
                                                value={[bathrooms]}
                                                onValueChange={(value) => setBathrooms(value[0])}
                                            />
                                            <div className="text-center text-xs text-muted-foreground">{bathrooms === 0 ? 'Cualquiera' : `${bathrooms}+`}</div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={handleResetFilters} className="w-full">
                                            Limpiar Filtros
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <ScrollArea className="flex-1">
                     <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">{filteredProperties.length} propiedades encontradas</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredProperties.length > 0 ? (
                                filteredProperties.map(property => (
                                    <PropertyCard 
                                        key={property.id} 
                                        property={property} 
                                        isHighlighted={highlightedPropertyId === property.id}
                                        onMouseEnter={() => setHighlightedPropertyId(property.id)}
                                        onMouseLeave={() => setHighlightedPropertyId(null)}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16 text-muted-foreground">
                                    <p>No se encontraron propiedades con estos filtros.</p>
                                </div>
                            )}
                        </div>
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
