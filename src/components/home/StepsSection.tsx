

'use client';

import { cn } from "@/lib/utils";
import { FileStack, PlaneLanding, Gavel, Home as HomeIcon, Handshake } from "lucide-react";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const steps = [
    {
        Icon: FileStack,
        title: "Preparación en tu país",
        description: "Documentos, apostillas y requisitos previos",
    },
    {
        Icon: PlaneLanding,
        title: "Llegada a España",
        description: "Recibimiento y primeros pasos",
    },
    {
        Icon: Gavel,
        title: "Trámites legales",
        description: "NIE, TIE y documentación oficial",
    },
    {
        Icon: HomeIcon,
        title: "Vivienda y alojamiento",
        description: "Encontrar tu hogar en España",
    },
    {
        Icon: Handshake,
        title: "Integración y comunidad",
        description: "Conectar con la comunidad colombiana",
    },
];

const stepColors = [
    { bg: "bg-[#FFCD00]", text: "text-black" },   // Colombia Yellow
    { bg: "bg-[#003893]", text: "text-white" },   // Colombia Blue
    { bg: "bg-[#C70039]", text: "text-white" },   // Colombia Red
    { bg: "bg-[#AA151B]", text: "text-white" },   // Spain Red
    { bg: "bg-[#F1BF00]", text: "text-black" },   // Spain Yellow
];

export default function StepsSection() {
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedStep, setSelectedStep] = useState(steps[0]);

    const handleStepClick = (step: typeof steps[0]) => {
        setSelectedStep(step);
        setModalOpen(true);
    };

    return (
        <section id="paso-a-paso" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Tu Viaje a España, Paso a Paso</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                        Te guiamos en cada etapa del proceso para que tu transición sea lo más fluida y tranquila posible.
                    </p>
                </div>

                <div className="relative max-w-3xl mx-auto">
                    {/* The vertical line */}
                    <div className="absolute left-8 top-8 h-full w-0.5 bg-gray-200 dark:bg-gray-700 md:left-1/2 md:-translate-x-1/2"></div>

                    {steps.map((step, index) => {
                        const { Icon, title, description } = step;
                        const color = stepColors[index % stepColors.length];
                        const isLeft = index % 2 === 0;

                        return (
                            <div key={index} className={cn("relative flex items-start mb-16", !isLeft && "md:flex-row-reverse")}>
                                {/* Content for left/right side */}
                                <div className="md:w-1/2">
                                    <div className={cn("pl-24 md:pl-0", isLeft ? "md:pr-16 md:text-right" : "md:pl-16 md:text-left")}>
                                        <h3 className="text-xl font-bold font-headline">{title}</h3>
                                        <p className="text-muted-foreground mt-1">{description}</p>
                                    </div>
                                </div>

                                {/* Spacer for the other side on desktop */}
                                <div className="hidden md:block w-1/2"></div>

                                {/* The circle on the timeline */}
                                <button
                                    onClick={() => handleStepClick(step)}
                                    className={cn(
                                        "absolute left-8 top-0 flex items-center justify-center w-20 h-20 rounded-full shadow-lg border-4 border-background md:left-1/2 md:-translate-x-1/2 -translate-x-1/2 cursor-pointer transition-transform hover:scale-110",
                                        color.bg,
                                        color.text
                                    )}
                                    aria-label={`Ver detalles para ${title}`}
                                >
                                    <Icon className="w-10 h-10" />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold border-2 border-background">
                                        {index + 1}
                                    </div>
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
             <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                    <DialogTitle>{selectedStep.title}</DialogTitle>
                    <DialogDescription>
                       Información detallada sobre esta etapa del proceso.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {/* Aquí iría el contenido detallado del paso */}
                        <p>Contenido ampliado para "{selectedStep.description}"...</p>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
