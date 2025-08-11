
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Building, Users, TrendingUp, Star, ArrowRight, MapPin, Bot, Search, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import type { PlaceDetails } from '@/lib/types';
import Image from 'next/image';

interface BusinessSectionProps {
    businesses: PlaceDetails[];
}

const StarRating = ({ rating, count }: { rating: number, count: number }) => {
    if (!rating || !count) return null;
    return (
        <div className="flex items-center gap-1.5">
             <div className="flex items-center">
                <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                <Star className="w-4 h-4 ml-1 text-yellow-400 fill-yellow-400" />
            </div>
            <span className="text-xs text-muted-foreground">({count} reseñas)</span>
        </div>
    );
};


export default function BusinessSection({ businesses }: BusinessSectionProps) {
    const [randomBusinesses, setRandomBusinesses] = useState<PlaceDetails[]>([]);

    useEffect(() => {
        const shuffled = [...businesses].sort(() => 0.5 - Math.random());
        setRandomBusinesses(shuffled.slice(0, 5));
    }, [businesses]);

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
             <div className="container px-4 md:px-6">
                <div className="relative bg-card rounded-xl shadow-lg p-8 md:p-12 overflow-hidden">
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
                                    <span><strong>Asistente IA:</strong> Activa un asistente en tu perfil para responder clientes 24/7.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 mt-1 text-green-500 flex-shrink-0"/>
                                    <span><strong>Visibilidad SEO:</strong> Mejora tu posicionamiento local con perfiles optimizados por IA.</span>
                                </li>
                                 <li className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 mt-1 text-green-500 flex-shrink-0"/>
                                    <span><strong>Gestión Simplificada:</strong> Publica ofertas de empleo y gestiona tu perfil fácilmente.</span>
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
                                    <Link href="/pricing">
                                        Ver planes y precios
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="min-h-[400px] flex items-center justify-center">
                             {randomBusinesses.length > 0 ? (
                                <Carousel
                                    opts={{ loop: true, align: "start" }}
                                    plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
                                    className="w-full max-w-sm"
                                >
                                    <CarouselContent>
                                        {randomBusinesses.map((biz) => (
                                            <CarouselItem key={biz.id}>
                                                <Card className="overflow-hidden shadow-lg border">
                                                    <CardHeader className="p-0 relative">
                                                        <Image 
                                                            src={biz.photoUrl || "https://placehold.co/400x250.png"} 
                                                            alt={biz.displayName || "Negocio destacado"}
                                                            width={400}
                                                            height={250}
                                                            data-ai-hint={`${biz.category} storefront`}
                                                            className="w-full h-48 object-cover"
                                                        />
                                                    </CardHeader>
                                                    <CardContent className="p-4 space-y-2">
                                                        <h3 className="font-bold font-headline text-lg line-clamp-2">{biz.displayName}</h3>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <Building className="h-4 w-4" /> {biz.category}
                                                        </p>
                                                         <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <MapPin className="h-4 w-4" /> {biz.city}
                                                        </p>
                                                        <StarRating rating={biz.rating!} count={biz.userRatingsTotal!} />
                                                    </CardContent>
                                                    <CardFooter className="p-2 border-t bg-muted/50">
                                                        <Button asChild className="w-full" variant="outline">
                                                            <Link href={`/directory/${biz.id}`}>
                                                                Ver Perfil
                                                            </Link>
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                            ) : (
                                <p className="text-muted-foreground">Cargando negocios...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
