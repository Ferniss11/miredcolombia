
'use client';

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { migrationPackages } from "@/lib/placeholder-data";
import type { MigrationPackage } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type PackagesSectionProps = {
    handlePurchaseClick?: (item: MigrationPackage, type: 'package') => void;
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

export default function PackagesSection({ handlePurchaseClick, eurToCopRate }: PackagesSectionProps) {
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
                    <div className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 py-12 max-w-6xl">
                        {migrationPackages.map((pkg) => {
                            const priceInCop = pkg.price * eurToCopRate;
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
                                        <p className="text-4xl font-extrabold">{formatPrice(pkg.price, 'EUR')}</p>
                                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                            <span>Aprox. {formatPrice(priceInCop, 'COP')}</span>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button className="p-0.5 rounded-full hover:bg-muted">
                                                        <Info className="h-3.5 w-3.5" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Tasa de cambio: 1 EUR ≈ {formatRate(eurToCopRate)}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
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
                                        <Button onClick={() => handlePurchaseClick?.(pkg, 'package')} className={cn("w-full text-white", pkg.color)}>Contratar {pkg.name}</Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </section>
        </TooltipProvider>
    );
}

PackagesSection.displayName = 'PackagesSection';
