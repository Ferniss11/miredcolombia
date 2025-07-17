
'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, MessageCircle } from "lucide-react";
import RealTimeClocks from "@/components/layout/RealTimeClocks";

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

type AiAssistantSectionProps = {
    onCtaClick: () => void;
};

export default function AiAssistantSection({ onCtaClick }: AiAssistantSectionProps) {
    const [randomTip, setRandomTip] = useState('');

    useEffect(() => {
        const tip = migrationTips[Math.floor(Math.random() * migrationTips.length)];
        setRandomTip(tip);
    }, []);

    return (
        <section id="asistente-ia" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="p-4 bg-primary/10 rounded-full inline-flex">
                        <Bot className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                        ¿Tienes Preguntas? Nuestro Asistente IA Responde al Instante
                    </h2>
                    <p className="max-w-3xl text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                        No importa si en Colombia es de madrugada o en España es festivo. Nuestro asistente virtual está disponible 24/7 para resolver tus dudas sobre visados, trámites, vivienda y más.
                    </p>
                    <Button size="lg" onClick={onCtaClick}>
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Chatea con el Asistente Ahora
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2">
                       <RealTimeClocks />
                    </div>
                     <Card className="h-full">
                        <CardContent className="pt-6 h-full flex flex-col justify-center">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl pt-1">💡</div>
                                <div>
                                    <h4 className="font-bold font-headline text-lg">Tip del Día</h4>
                                    <p className="text-muted-foreground mt-1">
                                        {randomTip || 'Cargando tip...'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </section>
    );
}
