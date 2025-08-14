
// src/components/services/ServiceCard.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Tag } from 'lucide-react';
import type { ServiceListing } from '@/lib/types';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';

interface ServiceCardProps {
    listing: ServiceListing;
}

const formatPriceType = (priceType: 'per_hour' | 'fixed' | 'per_project') => {
    switch (priceType) {
        case 'per_hour': return '/ hora';
        case 'fixed': return 'fijo';
        case 'per_project': return '/ proyecto';
        default: return '';
    }
};

const ServiceCard: React.FC<ServiceCardProps> = ({ listing }) => {
    return (
        <Collapsible asChild>
            <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full group">
                <CardHeader className="p-0 relative">
                    <Image
                        src={listing.imageUrl || "https://placehold.co/400x225.png"}
                        alt={listing.title}
                        width={400}
                        height={225}
                        data-ai-hint="professional service"
                        className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <Badge variant="outline" className="mb-2">{listing.category}</Badge>
                    <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2 h-14 group-hover:text-primary transition-colors">
                        {listing.title}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-2">
                        <p className="line-clamp-3">{listing.description}</p>
                         {listing.description.length > 100 && (
                            <CollapsibleTrigger asChild>
                                <Button variant="link" className="p-0 h-auto text-xs">Ver más</Button>
                            </CollapsibleTrigger>
                          )}
                          <CollapsibleContent>
                            <p className="mt-2 text-sm">{listing.description}</p>
                          </CollapsibleContent>
                    </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 mt-auto flex flex-col items-start gap-2">
                     <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{listing.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Tag className="h-4 w-4 flex-shrink-0" />
                        <span className="font-semibold text-foreground">€{listing.price}</span>
                        <span>{formatPriceType(listing.priceType)}</span>
                    </div>
                    {listing.contactViaWhatsApp && (
                         <Button asChild className="w-full mt-2">
                            <a href={`https://wa.me/${listing.contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                Contactar por WhatsApp
                            </a>
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </Collapsible>
    );
};

export default ServiceCard;
