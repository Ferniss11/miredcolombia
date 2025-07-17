
'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, MessageCircle, Clock, Lightbulb } from "lucide-react";
import RealTimeClocks from "@/components/layout/RealTimeClocks";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ChatWidget from "@/components/chat/ChatWidget";

const migrationTips = [
    "Recuerda apostillar todos tus documentos oficiales en Colombia antes de viajar.",
    "El empadronamiento es el primer trámite y el más importante al llegar a España. ¡No lo dejes para después!",
    "Si vienes con visa de estudiante, puedes trabajar hasta 30 horas semanales con un permiso de trabajo.",
    "Abre una cuenta bancaria tan pronto como tengas tu NIE. Facilitará todos los demás trámites.",
    "Investiga sobre el sistema de transporte público de tu ciudad, suele ser muy eficiente y económico.",
    "El seguro médico es obligatorio. Asegúrate de que tenga cobertura completa sin copagos.",
    "La 'TIE' (Tarjeta de Identidad de Extranjero) es tu documento de identificación físico en España.",
    "Guarda copias digitales de todos tus documentos importantes en la nube.",
    "No tengas miedo de preguntar. Los españoles suelen ser amables y dispuestos a ayudar.",
    "Para homologar tu título, el proceso puede tardar. ¡Inícialo cuanto antes!",
    "Conoce las diferencias culturales en los horarios de comida y de las tiendas."
];

export default function AiAssistantSection() {
    const [randomTip, setRandomTip] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        const tip = migrationTips[Math.floor(Math.random() * migrationTips.length)];
        setRandomTip(tip);
    }, []);

    return (
        <section id="asistente-ia" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
            <div className="container px-4 md:px-6">
                <Collapsible open={isChatOpen} onOpenChange={setIsChatOpen}>
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Side: Main CTA and Text */}
                        <div className="flex flex-col items-start space-y-6">
                            <div className="p-4 bg-primary/10 rounded-full inline-flex">
                                <Bot className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                                ¿Tienes Preguntas? Nuestro Asistente IA Responde al Instante
                            </h2>
                            <p className="max-w-xl text-muted-foreground md:text-xl/relaxed font-body">
                                No importa si en Colombia es de madrugada o en España es festivo. Nuestro asistente virtual está disponible 24/7 para resolver tus dudas sobre visados, trámites, vivienda y más.
                            </p>
                            <CollapsibleTrigger asChild>
                                <Button size="lg">
                                    <MessageCircle className="mr-2 h-5 w-5" />
                                    Chatea con el Asistente Ahora
                                </Button>
                            </CollapsibleTrigger>
                        </div>

                        {/* Right Side: Minimalist Clocks and Tips */}
                        <div className="space-y-4">
                           <RealTimeClocks variant="minimal" />
                            <div className="border rounded-lg p-4 bg-background/50">
                                <div className="flex items-start gap-4">
                                    <Lightbulb className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold font-headline text-md">Tip del Día</h4>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            {randomTip || 'Cargando tip...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <CollapsibleContent className="mt-8">
                        <div className="w-full max-w-lg mx-auto">
                            <ChatWidget embedded={true} />
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </section>
    );
}
