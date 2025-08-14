

'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Building, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import type { PlaceDetails } from '@/lib/types';
import Image from 'next/image';
import { StarRating } from './StarRating';


const PlaceholderCard = () => (
    <Card className="overflow-hidden shadow-lg border-2 border-dashed bg-primary/10 border-primary/30 h-full flex flex-col justify-center items-center text-center p-6">
        <div className="mx-auto p-4 bg-primary/20 rounded-full inline-flex mb-4">
            <Building className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold font-headline">Tu Negocio Aquí</h3>
        <p className="text-muted-foreground mt-2 mb-6 flex-grow">
           ¿Quieres que miles de colombianos te encuentren?
        </p>
        <Button asChild className="w-full">
            <Link href="/signup?role=advertiser">
                Registrarme Ahora
            </Link>
        </Button>
    </Card>
);

export default function BusinessSection({ businesses }: { businesses: PlaceDetails[] }) {
    const carouselItems = React.useMemo(() => {
        // The businesses are already shuffled on the server.
        const items: (PlaceDetails | { type: 'placeholder' })[] = [...businesses];
        
        // Insert placeholder card strategically
        if (items.length > 1) {
            items.splice(2, 0, { type: 'placeholder' });
        } else {
            items.push({ type: 'placeholder' });
        }
        items.unshift({ type: 'placeholder' });

        return items;
    }, [businesses]);

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10">
             <div className="container">
                <div className="relative bg-card rounded-xl shadow-lg p-6 md:p-8 lg:p-12">
                    <div className="absolute inset-0 bg-conic-glow opacity-20 z-0"></div>
                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                             <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                <Building className="h-5 w-5" />
                                <span>Para Negocios</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold font-headline">¿Tienes un negocio en España?</h2>
                            <p className="text-muted-foreground text-lg">
                                Conecta con miles de colombianos que necesitan tus servicios. Promociona tu negocio en la plataforma líder de migración.
                            </p>
                             <ul className="space-y-4 text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 mt-1 text-green-500 flex-shrink-0"/>
                                    <div className="w-full">
                                        <p><strong>Asistente IA:</strong> Activa un asistente en tu perfil para responder clientes 24/7.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 mt-1 text-green-500 flex-shrink-0"/>
                                    <div className="w-full">
                                        <p><strong>Posicionamiento SEO:</strong> Mejora tu SEO local con perfiles optimizados por IA.</p>
                                    </div>
                                </li>
                                 <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 mt-1 text-green-500 flex-shrink-0"/>
                                    <div className="w-full">
                                       <p><strong>Gestión Simplificada:</strong> Publica ofertas de empleo y gestiona tu perfil fácilmente.</p>
                                    </div>
                                </li>
                            </ul>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    <Link href="/signup?role=advertiser">
                                        Registrar mi negocio
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="outline">
                                    <Link href="/precios">
                                        Ver planes y precios
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="min-h-[400px] flex items-center justify-center">
                             {businesses.length > 0 ? (
                                <Carousel
                                    opts={{ loop: true, align: "start" }}
                                    plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
                                    className="w-full max-w-sm"
                                >
                                    <CarouselContent>
                                        {carouselItems.map((item, index) => (
                                            <CarouselItem key={index}>
                                                {'type' in item && item.type === 'placeholder' ? (
                                                    <PlaceholderCard />
                                                ) : (
                                                    <Card className="overflow-hidden shadow-lg border h-full">
                                                        <CardHeader className="p-0 relative">
                                                            <Image 
                                                                src={(item as PlaceDetails).photoUrl || "https://placehold.co/400x250.png"} 
                                                                alt={(item as PlaceDetails).displayName || "Negocio destacado"}
                                                                width={400}
                                                                height={250}
                                                                data-ai-hint={`${(item as PlaceDetails).category} storefront`}
                                                                className="w-full h-48 object-cover"
                                                            />
                                                        </CardHeader>
                                                        <CardContent className="p-4 space-y-2">
                                                            <h3 className="font-bold font-headline text-lg line-clamp-2">{(item as PlaceDetails).displayName}</h3>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                                <Building className="h-4 w-4" /> {(item as PlaceDetails).category}
                                                            </p>
                                                            <StarRating rating={(item as PlaceDetails).rating} count={(item as PlaceDetails).userRatingsTotal} />
                                                        </CardContent>
                                                        <CardFooter className="p-2 border-t bg-muted/50">
                                                            <Button asChild className="w-full" variant="outline">
                                                                <Link href={`/directorio/${(item as PlaceDetails).id}`}>
                                                                    Ver Perfil
                                                                </Link>
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                )}
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                            ) : (
                                <PlaceholderCard />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
