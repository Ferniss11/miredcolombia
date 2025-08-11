

'use client';

import { cn } from "@/lib/utils";
import { FileStack, PlaneLanding, Gavel, Home as HomeIcon, Handshake, MessageCircle, Bot } from "lucide-react";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "../ui/button";
import { useChat } from "@/context/ChatContext";

const steps = [
    {
        Icon: FileStack,
        title: "Preparación en tu país",
        description: "Documentos, apostillas y requisitos previos",
        details: "Asegúrate de tener tu pasaporte vigente, apostillar tus títulos académicos y antecedentes penales. Es crucial investigar los tipos de visado que aplican a tu caso (estudios, trabajo, etc.) y reunir toda la documentación con antelación. No olvides un seguro médico con cobertura internacional para los primeros días."
    },
    {
        Icon: PlaneLanding,
        title: "Llegada a España",
        description: "Recibimiento y primeros pasos",
        details: "Al llegar, pasarás por inmigración donde te sellarán el pasaporte. Contrata un servicio de recogida para evitar estrés. Una vez instalado, consigue una tarjeta SIM española para tener comunicación local. Los primeros días son para adaptarte y ubicarte en tu nuevo entorno."
    },
    {
        Icon: Gavel,
        title: "Trámites legales",
        description: "NIE, TIE y documentación oficial",
        details: "El primer trámite fundamental es el empadronamiento. Después, deberás solicitar tu Número de Identidad de Extranjero (NIE) y, si corresponde, tu Tarjeta de Identidad de Extranjero (TIE). Cada trámite requiere citas previas y formularios específicos. La organización es clave."
    },
    {
        Icon: HomeIcon,
        title: "Vivienda y alojamiento",
        description: "Encontrar tu hogar en España",
        details: "La búsqueda de piso puede ser competitiva. Prepara un mes de fianza y el mes corriente. Portales como Idealista o Fotocasa son muy populares. Es recomendable visitar los pisos en persona y leer bien el contrato de alquiler antes de firmar. Considera la ubicación y el transporte público."
    },
    {
        Icon: Handshake,
        title: "Integración y comunidad",
        description: "Conectar con la comunidad colombiana",
        details: "¡No estás solo! Participa en eventos, únete a grupos y visita negocios de la comunidad. Nuestra plataforma es un excelente punto de partida para conectar con otros colombianos que ya han pasado por lo mismo y pueden ofrecerte consejos valiosos y una red de apoyo."
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
    const [selectedStep, setSelectedStep] = useState<(typeof steps)[0] | null>(null);
    const { openChat } = useChat();

    const phoneNumber = "34653863675";
    const whatsappMessage = selectedStep ? encodeURIComponent(`Hola, tengo una pregunta sobre el paso: "${selectedStep.title}"`) : '';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;

    const handleStepClick = (step: typeof steps[0]) => {
        setSelectedStep(step);
        setModalOpen(true);
    };

    const handleOpenChatAssistant = () => {
        setModalOpen(false);
        openChat();
    }

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
                    <DialogTitle>{selectedStep?.title}</DialogTitle>
                    <DialogDescription>
                       Información detallada sobre esta etapa del proceso.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 text-muted-foreground">
                        <p>{selectedStep?.details}</p>
                    </div>
                     <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 pt-4 border-t">
                        <Button asChild variant="outline" className="hover:bg-green-600 hover:text-white">
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="mr-2 h-4 w-4" /> Hablar por WhatsApp
                            </a>
                        </Button>
                        <Button onClick={handleOpenChatAssistant}>
                            <Bot className="mr-2 h-4 w-4" /> Preguntar al Asistente IA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
