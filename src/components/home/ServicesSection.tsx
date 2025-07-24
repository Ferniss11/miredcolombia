
'use client';

import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { migrationServices } from "@/lib/placeholder-data";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
    User,
    FileText,
    Home as HomeIcon,
    CreditCard,
    Shield,
    Plane,
    MapPin,
    Clock,
    type LucideIcon,
} from "lucide-react";
import Image from "next/image";

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
    eurToCopRate: number;
};

const formatPrice = (price: number, currency: 'EUR' | 'COP') => {
    return new Intl.NumberFormat(currency === 'EUR' ? 'es-ES' : 'es-CO', { 
        style: 'currency', 
        currency,
        maximumFractionDigits: 0,
    }).format(price);
};

const formatRate = (rate: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(rate);
}


export default function ServicesSection({ eurToCopRate }: ServicesSectionProps) {
    const phoneNumber = "34653863675"; 
    
    return (
        <TooltipProvider>
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
                     <div className="mx-auto max-w-6xl mt-8">
                         <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-lg">
                            <div className="flex flex-col md:flex-row items-center p-6 space-y-4 md:space-y-0 md:space-x-6">
                                <div className="flex-shrink-0">
                                    <div className="w-28 h-28 rounded-full flex items-center justify-center"
                                         style={{
                                             background: 'linear-gradient(to bottom, #AA151B 25%, #F1BF00 25%, #F1BF00 75%, #AA151B 75%)'
                                         }}>
                                        <div className="w-24 h-24 rounded-full bg-white shadow-inner flex items-center justify-center">
                                            <Image
                                                src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2Fagencia%20de%20viajes.%20.jpg?alt=media&token=1053bc22-ea27-4dd4-8460-e3c2e2dcc4c2"
                                                alt="Logo Agencia de Viajes"
                                                width={80}
                                                height={80}
                                                className="rounded-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow text-center md:text-left">
                                    <h3 className="text-2xl font-bold font-headline">¿Listo para volar a España?</h3>
                                    <p className="text-muted-foreground mt-1 max-w-xl">
                                        Cotiza tu viaje con nosotros. Te garantizamos precios competitivos para que tu presupuesto llegue más lejos.
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                     <Button asChild size="lg">
                                        <a href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hola, me gustaría recibir una cotización para mi viaje a España.')}`} target="_blank" rel="noopener noreferrer">
                                            Cotizar Viaje Ahora
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12 max-w-6xl">
                        {migrationServices.map((service) => {
                            const Icon = serviceIcons[service.icon];
                            const whatsappMessage = encodeURIComponent(`Hola, me gustaría tener más información sobre el servicio de ${service.title}.`);
                            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;

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
                                        <p className="mt-2 text-sm">{service.description}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button asChild className={cn("w-full text-white", service.buttonColor)}>
                                             <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Solicitar por WhatsApp</a>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Travel Agency Banner */}
                   
                </div>
            </section>
        </TooltipProvider>
    );
}

ServicesSection.displayName = 'ServicesSection';
