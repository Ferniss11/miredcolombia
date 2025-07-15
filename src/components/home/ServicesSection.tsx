
'use client';

import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { migrationServices } from "@/lib/placeholder-data";
import type { MigrationService } from "@/lib/types";
import {
    User,
    FileText,
    Home as HomeIcon,
    CreditCard,
    Shield,
    Plane,
    MapPin,
    Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const serviceIcons: { [key: string]: LucideIcon } = {
    User,
    FileText,
    Home: HomeIcon,
    CreditCard,
    Shield,
    Plane,
    MapPin,
    Clock,
};

type ServicesSectionProps = {
    handlePurchaseClick?: (item: MigrationService, type: 'service') => void;
    eurToCopRate: number;
};

const formatPrice = (price: number, currency: 'EUR' | 'COP') => {
    return new Intl.NumberFormat(currency === 'EUR' ? 'es-ES' : 'es-CO', { 
        style: 'currency', 
        currency,
        maximumFractionDigits: 0,
    }).format(price);
};


export default function ServicesSection({ handlePurchaseClick, eurToCopRate }: ServicesSectionProps) {
    return (
        <section id="services" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-white px-3 py-1 text-sm dark:bg-gray-700">Servicios Individuales</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Servicios a tu Medida</h2>
                        <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 font-body">
                            ¿Necesitas ayuda con algo específico? Contrata solo los servicios que necesites para facilitar tu proceso.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-12">
                    {migrationServices.map((service) => {
                        const Icon = serviceIcons[service.icon];
                        const priceInCop = service.price * eurToCopRate;
                        return (
                            <Card key={service.id} className={cn("overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col")}>
                                <div className="h-1.5 flex w-full">
                                    <div className="w-1/2 bg-[#AA151B]"></div>
                                    <div className="w-1/2 bg-[#F1BF00]"></div>
                                </div>
                                <CardHeader className="items-center text-center pt-4">
                                    <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <Icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <CardTitle className="font-headline text-xl mt-4">{service.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center flex-grow">
                                    <p className="text-2xl font-bold">{formatPrice(service.price, 'EUR')}</p>
                                    <p className="text-xs text-muted-foreground">Aprox. {formatPrice(priceInCop, 'COP')}</p>
                                    <p className="mt-2 text-sm">{service.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={() => handlePurchaseClick?.(service, 'service')} className={cn("w-full text-white", service.buttonColor)}>Solicitar</Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}

ServicesSection.displayName = 'ServicesSection';
