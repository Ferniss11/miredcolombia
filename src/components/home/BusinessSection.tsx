
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Building, Users, TrendingUp, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from '../ui/card';
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import type { PlaceDetails } from '@/lib/types';
import Image from 'next/image';

interface BusinessSectionProps {
    businesses: PlaceDetails[];
}

const StarRating = ({ rating, count }: { rating: number, count: number }) => {
    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
            </div>
            <span className="text-xs text-muted-foreground">({count})</span>
        </div>
    );
};


export default function BusinessSection({ businesses }: BusinessSectionProps) {
    const [randomBusinesses, setRandomBusinesses] = useState<PlaceDetails[]>([]);

    useEffect(() => {
        // Shuffle the array and take the first 5
        const shuffled = [...businesses].sort(() => 0.5 - Math.random());
        setRandomBusinesses(shuffled.slice(0, 5));
    }, [businesses]);

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/20">
            <div className="container px-4 md:px-6">
                <Card className="bg-white dark:bg-card rounded-xl shadow-lg p-8 md:p-12">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                             <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                <Building className="h-5 w-5" />
                                <span>Para Negocios</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold font-headline">¿Tienes un negocio en España?</h2>
                            <p className="text-muted-foreground text-lg">
                                Conecta con miles de colombianos que necesitan tus servicios. Promociona tu negocio en la plataforma líder de migración.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    <span className="font-medium">+10,000 usuarios</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    <span className="font-medium">95% satisfacción</span>
                                </div>
                            </div>
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

                        <div className="bg-primary/10 rounded-lg p-6 shadow-inner min-h-[280px]">
                            {randomBusinesses.length > 0 ? (
                                <Carousel
                                    opts={{ loop: true, align: "start" }}
                                    plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
                                >
                                    <CarouselContent>
                                        {randomBusinesses.map((biz) => (
                                            <CarouselItem key={biz.id}>
                                                <div className="flex flex-col items-center text-center p-4">
                                                    <div className="p-2 bg-primary rounded-full mb-4 inline-flex shadow-md">
                                                        {biz.photoUrl ? (
                                                            <Image src={biz.photoUrl} alt={biz.displayName} width={48} height={48} className="rounded-full object-cover" />
                                                        ) : (
                                                            <Building className="h-8 w-8 text-primary-foreground" />
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold font-headline text-xl">{biz.displayName}</h3>
                                                    {biz.rating && biz.userRatingsTotal && (
                                                         <div className="my-2">
                                                            <StarRating rating={biz.rating} count={biz.userRatingsTotal} />
                                                        </div>
                                                    )}
                                                    <p className="text-muted-foreground text-sm italic mt-2">
                                                        "{biz.category} en {biz.city}"
                                                    </p>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                            ) : (
                                 <div className="flex flex-col items-center text-center p-4">
                                    <div className="p-4 bg-primary rounded-full mb-4">
                                        <Building className="h-8 w-8 text-primary-foreground" />
                                    </div>
                                    <h3 className="font-bold font-headline text-xl">Tu Negocio Aquí</h3>
                                     <div className="flex gap-1 text-yellow-400 my-2">
                                        <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
                                    </div>
                                    <p className="text-muted-foreground text-sm italic">"Excelente servicio para la comunidad colombiana"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </section>
    );
}
