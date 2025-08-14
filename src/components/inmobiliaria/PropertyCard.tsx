// src/components/inmobiliaria/PropertyCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { BedDouble, Bath, Square, MapPin } from 'lucide-react';
import type { Property } from '@/lib/real-estate/domain/property.entity';
import { cn } from '@/lib/utils';

interface PropertyCardProps {
    property: Property;
    isHighlighted: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, isHighlighted, onMouseEnter, onMouseLeave }) => {
    return (
        <Card 
            className={cn(
                "overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group",
                isHighlighted && "ring-2 ring-primary shadow-2xl"
            )}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <CardHeader className="p-0 relative">
                 {property.images && property.images.length > 0 ? (
                    <Carousel className="w-full">
                        <CarouselContent>
                            {property.images.map((img, index) => (
                                <CarouselItem key={index}>
                                    <Image
                                        src={img}
                                        alt={`${property.title} - imagen ${index + 1}`}
                                        width={400}
                                        height={225}
                                        className="w-full h-48 object-cover"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {property.images.length > 1 && <>
                            <CarouselPrevious className="absolute left-2" />
                            <CarouselNext className="absolute right-2" />
                        </>}
                    </Carousel>
                ) : (
                    <Image
                        src="https://placehold.co/400x225.png"
                        alt="Imagen no disponible"
                        width={400}
                        height={225}
                        className="w-full h-48 object-cover"
                    />
                )}
                 <div className="absolute top-2 left-2">
                    <Badge>{property.listingType === 'rent' ? 'Alquiler' : 'Venta'}</Badge>
                 </div>
            </CardHeader>
            <Link href={`/inmobiliaria/${property.id}`} className="flex flex-col flex-grow">
                 <CardContent className="p-4 flex-grow">
                    <div className="flex justify-between items-start">
                        <p className="text-sm text-primary font-semibold">{property.propertyType === 'apartment' ? 'Apartamento' : property.propertyType === 'house' ? 'Casa' : 'Habitación'}</p>
                        <p className="text-xl font-bold font-headline">{formatPrice(property.price)}</p>
                    </div>
                    <h3 className="font-bold text-lg line-clamp-2 mt-1 h-14">{property.title}</h3>
                     <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 border-t pt-2">
                        <div className="flex items-center gap-1.5"><BedDouble className="h-4 w-4"/> {property.bedrooms}</div>
                        <div className="flex items-center gap-1.5"><Bath className="h-4 w-4"/> {property.bathrooms}</div>
                        <div className="flex items-center gap-1.5"><Square className="h-4 w-4"/> {property.area} m²</div>
                    </div>
                     <p className="text-xs text-muted-foreground flex items-center mt-2 line-clamp-1">
                        <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0"/>{property.address}
                    </p>
                 </CardContent>
            </Link>
        </Card>
    );
};

export default PropertyCard;
