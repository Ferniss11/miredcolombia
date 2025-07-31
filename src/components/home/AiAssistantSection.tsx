'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, MessageCircle, Lightbulb } from "lucide-react";
import RealTimeClocks from "@/components/layout/RealTimeClocks";
import { cn } from "@/lib/utils";

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

export default function AiAssistantSection({ onOpenChatModal }: { onOpenChatModal: () => void }) {
    const [randomTip, setRandomTip] = useState('');
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        const getNextTip = () => {
            setRandomTip(prevTip => {
                let newTip;
                do {
                    newTip = migrationTips[Math.floor(Math.random() * migrationTips.length)];
                } while (newTip === prevTip);
                return newTip;
            });
            setAnimationKey(prevKey => prevKey + 1);
        };
        
        getNextTip();
        const tipInterval = setInterval(getNextTip, 5000); // Rotate tip every 5 seconds
        
        return () => clearInterval(tipInterval);
    }, []);

    return (
        <section id="asistente-ia" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
            <div className="container px-4 md:px-6">
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
                        <Button size="lg" onClick={onOpenChatModal}>
                            <MessageCircle className="mr-2 h-5 w-5" />
                            Chatea con el Asistente Ahora
                        </Button>
                    </div>

                    {/* Right Side: Minimalist Clocks and Tips */}
                     <div className="space-y-4">
                        <div className="border rounded-lg bg-background/50 overflow-hidden">
                            <div className="h-1 flex w-full">
                                <div className="w-1/2 bg-[#FFCD00]"></div>
                                <div className="w-1/4 bg-[#003893]"></div>
                                <div className="w-1/4 bg-[#C70039]"></div>
                            </div>
                            <RealTimeClocks variant="minimal" country="Colombia" />
                        </div>
                         <div className="border rounded-lg bg-background/50 overflow-hidden">
                            <div className="h-1 flex w-full">
                                <div className="w-1/2 bg-[#AA151B]"></div>
                                <div className="w-1/2 bg-[#F1BF00]"></div>
                            </div>
                            <RealTimeClocks variant="minimal" country="Spain" />
                        </div>
                        <div className="border rounded-lg p-4 bg-background/50 overflow-hidden relative h-[110px]">
                            <div key={animationKey} className="animate-slide-in-up">
                                <div className="flex items-start gap-4">
                                    <Lightbulb className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold font-headline text-md">Tip del Día</h4>
                                        <p className="text-muted-foreground text-sm mt-1 h-12">
                                            {randomTip || 'Cargando tip...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
