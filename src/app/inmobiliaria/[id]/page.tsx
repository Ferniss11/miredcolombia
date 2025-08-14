
import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicPropertyByIdAction } from '@/lib/real-estate/infrastructure/nextjs/property.server-actions';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
    BedDouble, Bath, Square, MapPin, Check, Phone, Mail, Home,
    Wifi, Snowflake, Thermometer, Wind, UtensilsCrossed, WashingMachine
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import BusinessMap from '@/components/directory/BusinessMap';
import ContactForm from './_components/ContactForm';


type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { property } = await getPublicPropertyByIdAction(params.id);
 
  if (!property) {
    return {
      title: 'Propiedad no encontrada'
    }
  }

  const title = `${property.title} | Mi Red Colombia`;
  const description = property.description.substring(0, 160).trim() + '...';
 
  return {
    title,
    description,
    openGraph: {
        title,
        description,
        images: [
            {
                url: property.images?.[0] || 'https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b',
                width: 1200,
                height: 630,
                alt: property.title,
            },
        ],
    },
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);
};

const amenityIcons = {
    wifi: Wifi,
    heating: Thermometer,
    ac: Snowflake,
    kitchen: UtensilsCrossed,
    washing_machine: WashingMachine,
    balcony: Home, // Using Home icon for Balcony
    pool: Wind, // Using Wind icon for Pool, needs better mapping
    gym: Wind, // Using Wind icon for Gym, needs better mapping
} as const;

export default async function PropertyDetailsPage({ params }: Props) {
  const { property, error } = await getPublicPropertyByIdAction(params.id);
  
  if (error || !property) {
    notFound();
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Image Carousel Header */}
            <header className="mb-8">
                 {property.images && property.images.length > 0 ? (
                    <Carousel className="w-full rounded-xl overflow-hidden shadow-lg">
                        <CarouselContent>
                            {property.images.map((img, index) => (
                                <CarouselItem key={index}>
                                    <Image
                                        src={img}
                                        alt={`${property.title} - imagen ${index + 1}`}
                                        width={1200}
                                        height={600}
                                        className="w-full h-[300px] md:h-[500px] object-cover"
                                        priority={index === 0}
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                         {property.images.length > 1 && <>
                            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
                            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
                        </>}
                    </Carousel>
                ) : (
                    <div className="w-full h-[300px] md:h-[500px] bg-muted rounded-xl flex items-center justify-center">
                        <Home className="w-24 h-24 text-muted-foreground" />
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Title and Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <Badge>{property.listingType === 'rent' ? 'Alquiler' : 'Venta'}</Badge>
                                <div className="text-right">
                                    <p className="text-3xl font-bold font-headline">{formatPrice(property.price)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {property.listingType === 'rent' ? '/ mes' : ''}
                                    </p>
                                </div>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold font-headline pt-4">{property.title}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground pt-1">
                                <MapPin className="h-4 w-4"/>
                                <span>{property.address}</span>
                            </div>
                             <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4">
                                <div className="flex items-center gap-1.5"><BedDouble className="h-5 w-5 text-primary"/> {property.bedrooms} hab.</div>
                                <div className="flex items-center gap-1.5"><Bath className="h-5 w-5 text-primary"/> {property.bathrooms} baños</div>
                                <div className="flex items-center gap-1.5"><Square className="h-5 w-5 text-primary"/> {property.area} m²</div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Descripción</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: property.description.replace(/\n/g, '<br />') }} />
                        </CardContent>
                    </Card>
                    
                    {/* Amenities */}
                    {property.amenities && property.amenities.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Servicios y Comodidades</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {property.amenities.map(amenityKey => {
                                    const Icon = amenityIcons[amenityKey as keyof typeof amenityIcons] || Check;
                                    const label = amenityKey.replace(/_/g, ' ');
                                    return (
                                        <div key={amenityKey} className="flex items-center gap-2">
                                            <Icon className="w-5 h-5 text-green-500" />
                                            <span className="capitalize">{label}</span>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* Map */}
                     <Card>
                        <CardHeader><CardTitle>Ubicación</CardTitle></CardHeader>
                        <CardContent>
                            <div className="aspect-video w-full rounded-lg overflow-hidden">
                                <BusinessMap center={property.location} name={property.title} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Right Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="sticky top-24 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl">Contactar al Anunciante</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <ContactForm ownerName={property.owner.name} propertyTitle={property.title} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
}

