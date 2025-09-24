
'use client';

import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Briefcase, Plane } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import RequestQuoteSheet from "./RequestQuoteSheet";

export default function PackagesSection() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState('');

    const packages = [
        {
            icon: MessageSquare,
            title: "Consultoría Inicial",
            price: "39€",
            id: "pack_consultoria",
            description: "Resuelve tus dudas con un experto y empieza con seguridad.",
            link: "/checkout/pack_consultoria",
            actionType: "link" as const,
            color: "bg-[#003893]" // Colombia Blue
        },
        {
            icon: Briefcase,
            title: "Onboarding en España",
            price: "A tu medida",
            id: "pack_onboarding",
            description: "Te recibimos, te guiamos en tus primeros trámites y te acompañamos en la adaptación.",
            link: "#",
            actionType: "modal" as const,
            color: "bg-[#FFCD00]" // Colombia Yellow
        },
        {
            icon: Plane,
            title: "Viaje Completo",
            price: "Personalizado",
            id: "pack_viaje",
            description: "Organizamos tu viaje a España con seguridad: vuelos, seguros y traslados.",
            link: "#",
            actionType: "modal" as const,
            color: "bg-[#C70039]" // Colombia Red
        }
    ];

    const handleCardClick = (pkg: typeof packages[0]) => {
        if (pkg.actionType === 'modal') {
            setSelectedPackage(pkg.title);
            setIsSheetOpen(true);
        }
    };

    return (
        <>
            <section id="packages-home" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-card">
                <div className="container px-4 md:px-6 max-w-6xl">
                     <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Nuestros Packs de Servicios</h1>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                            Soluciones integrales y personalizadas, ofrecidas por nuestros partners expertos, para garantizar una transición a España sin contratiempos. Elige un punto de partida o solicita un presupuesto a medida.
                        </p>
                    </div>
                    <div className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {packages.map((pkg) => {
                            const CardWrapper = pkg.actionType === 'link' ? Link : 'div';
                            return (
                                <CardWrapper key={pkg.title} href={pkg.link || '#'}>
                                    <Card 
                                        className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group h-full cursor-pointer"
                                        onClick={pkg.actionType === 'modal' ? () => handleCardClick(pkg) : undefined}
                                    >
                                        <div className={cn("h-2 w-full", pkg.color)}></div>
                                        <CardHeader className="text-center pt-8">
                                            <div className="mx-auto p-4 bg-primary/10 rounded-full inline-flex mb-4">
                                                <pkg.icon className="w-8 h-8 text-primary" />
                                            </div>
                                            <CardTitle className="font-headline text-2xl">{pkg.title}</CardTitle>
                                            <CardDescription className="font-semibold text-lg">{pkg.price}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="text-center flex-grow">
                                            <p className="text-muted-foreground">{pkg.description}</p>
                                        </CardContent>
                                    </Card>
                                </CardWrapper>
                            );
                        })}
                    </div>
                </div>
            </section>
            <RequestQuoteSheet 
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                packageName={selectedPackage}
            />
        </>
    );
}
