
// src/components/services/ServiceCard.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Tag } from 'lucide-react';
import type { ServiceListing } from '@/lib/types';

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
                <div className="space-y-2 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{listing.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 flex-shrink-0" />
                        <span className="font-semibold text-foreground">€{listing.price}</span>
                        <span>{formatPriceType(listing.priceType)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 mt-auto">
                {/* Future: Link to a detail page */}
                <Button asChild className="w-full">
                    <a href={`https://wa.me/${listing.contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                        Contactar
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default ServiceCard;
