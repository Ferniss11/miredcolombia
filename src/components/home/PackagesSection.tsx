
'use client';

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { migrationPackages } from "@/lib/placeholder-data";
import type { MigrationPackage } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type PackagesSectionProps = {
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

export default function PackagesSection({ eurToCopRate }: PackagesSectionProps) {
    const phoneNumber = "34653863675"; 

    return (
        <TooltipProvider>
            <section id="packages" className="w-full py-12 md:py-24 lg:py-32 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">Paquetes de Asesoría</div>
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Nuestros Planes de Acompañamiento</h2>
                            <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 font-body">
                                Elige el plan que mejor se adapte a tus necesidades y comienza tu nueva vida en España con tranquilidad.
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto max-w-6xl py-12">
                        {/* Featured Horizontal Card */}
                        <Card className="mb-12 w-full overflow-hidden rounded-xl shadow-lg transition-shadow hover:shadow-xl">
                            <div className="h-1.5 flex w-full">
                                <div className="w-1/4 bg-[#AA151B]"></div>
                                <div className="w-1/2 bg-[#F1BF00]"></div>
                                <div className="w-1/4 bg-[#AA151B]"></div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center">
                                <div className="flex-shrink-0 p-6 bg-gray-100 dark:bg-gray-800 self-stretch flex items-center justify-center">
                                    <HelpCircle className="w-12 h-12 text-primary" />
                                </div>
                                <div className="flex-grow p-6">
                                    <h3 className="text-xl font-bold font-headline">Asesoría Inicial</h3>
                                    <p className="text-muted-foreground mt-1">Resolución de dudas iniciales y orientación sobre el proceso. Ideal para quienes no saben por dónde empezar.</p>
                                </div>
                                <div className="p-6 flex-shrink-0 text-center md:text-right">
                                    <div className="text-3xl font-bold">{formatPrice(10, 'EUR')}</div>
                                    <div className="text-sm text-muted-foreground">
                                        Aprox. {formatPrice(10 * eurToCopRate, 'COP')}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button className="p-0.5 rounded-full hover:bg-muted ml-1 align-middle">
                                                    <Info className="h-3.5 w-3.5" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Tasa de cambio: 1 EUR ≈ {formatRate(eurToCopRate)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Button asChild size="lg" className="mt-4">
                                        <a href={`https://wa.me/34653863675?text=${encodeURIComponent('Hola, me gustaría tener más información sobre la Asesoría Inicial.')}`} target="_blank" rel="noopener noreferrer">
                                            Solicitar Información
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Existing 3 Packages */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {migrationPackages.map((pkg) => {
                                const whatsappMessage = encodeURIComponent(`Hola, me gustaría tener más información sobre el paquete ${pkg.name}.`);
                                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;
                                
                                return (
                                    <Card key={pkg.id} className={cn("flex flex-col rounded-xl shadow-lg transition-transform hover:scale-105 overflow-hidden", { 'border-2 border-primary': pkg.popular })}>
                                        {pkg.popular && (
                                            <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-semibold">Más Popular</div>
                                        )}
                                        <div className="h-1.5 flex w-full">
                                            <div className="w-1/2 bg-[#FFCD00]"></div>
                                            <div className="w-1/4 bg-[#003893]"></div>
                                            <div className="w-1/4 bg-[#C70039]"></div>
                                        </div>
                                        <CardHeader className="text-center">
                                            <h3 className={cn("text-2xl font-bold font-headline", pkg.textColor)}>{pkg.name}</h3>
                                            <p className="text-sm pt-2">{pkg.description}</p>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <ul className="space-y-3">
                                                {pkg.features.map((feature, i) => (
                                                    <li key={i} className="flex items-start">
                                                        <Check className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-1" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Button asChild className={cn("w-full text-white", pkg.color)}>
                                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Solicitar por WhatsApp</a>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </section>
        </TooltipProvider>
    );
}

PackagesSection.displayName = 'PackagesSection';
