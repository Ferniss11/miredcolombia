
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, MessageSquare, Shield, PlayCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { ValeriaPlan } from "@/lib/types";
import CheckoutSheet from "../checkout/CheckoutSheet";


const valeriaPlans: ValeriaPlan[] = [
    {
      id: 'plan_free', // Internal ID, doesn't go to Stripe
      name: 'Gratis',
      price: 0,
      priceDetails: '',
      features: [
        '3 consultas al día',
        'Respuestas básicas de la base de conocimiento',
        'Acceso al chat 24/7',
      ],
      cta: 'Empezar Gratis',
      variant: 'outline'
    },
    {
      id: 'valeria_premium', // Use internal plan name
      name: 'Valeria Premium',
      price: 4.97,
      priceDetails: '/ mes',
      features: [
        'Consultas ilimitadas',
        'Respuestas extendidas y detalladas',
        'Acceso a checklists descargables',
        'Análisis de documentos',
        'Alertas de empleo y vivienda',
      ],
      cta: 'Comprar Premium',
       variant: 'default'
    },
    {
      id: 'valeria_premium_quarterly',
      name: 'Valeria Premium Trimestral',
      price: 9.97,
      priceDetails: '/ 3 meses',
       features: [
        'Un solo pago',
        'Acceso completo a todas las funciones Premium',
        'Ideal para cubrir preparación y llegada',
        'Ahorra un 33% sobre el precio mensual',
      ],
      cta: 'Aprovechar Oferta',
      variant: 'default'
    }
];

const allFeatures = [
    { key: 'consultas', label: 'Consultas al mes' },
    { key: 'base_conocimiento', label: 'Base de conocimiento' },
    { key: 'analisis_documentos', label: 'Análisis de documentos' },
    { key: 'plantillas', label: 'Acceso a plantillas y checklists' },
];

const featureData: { [key: string]: { free: string | boolean; premium: string | boolean } } = {
    consultas: { free: 'Hasta 3', premium: 'Ilimitadas' },
    base_conocimiento: { free: true, premium: true },
    analisis_documentos: { free: false, premium: true },
    plantillas: { free: false, premium: true },
};

type AiAssistantSectionProps = {
    onOpenChatModal: () => void;
};

export default function AiAssistantSection({ onOpenChatModal }: AiAssistantSectionProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [showVideo, setShowVideo] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<ValeriaPlan | null>(null);

    const handlePlanSelection = (plan: ValeriaPlan) => {
        if (plan.id === 'plan_free') {
            onOpenChatModal();
        } else {
            setSelectedPlan(plan);
            setIsSheetOpen(true);
        }
    };
    
    return (
        <>
            <section id="asistente-ia" className="w-full py-12 md:py-24 lg:py-32 bg-background">
                <div className="container space-y-16">
                    
                    {/* Unified container for alignment */}
                    <div className="max-w-6xl mx-auto space-y-16">
                        {/* --- Main Info & Video --- */}
                        <div className="grid lg:grid-cols-3 gap-12 items-center">
                            <div className="space-y-6 lg:col-span-1">
                                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Asistente IA</div>
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
                                    Tu Puente de Colombia a España Empieza Hoy
                                </h2>
                                <p className="text-muted-foreground md:text-xl/relaxed">
                                    Valeria te guía paso a paso para que tomes decisiones rápidas y seguras en tu proceso migratorio. Sin vueltas, sin miedo, sin errores.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0"/><span><strong>Empleo legal:</strong> CV optimizado, portales que funcionan y cómo evitar contratos fraudulentos.</span></li>
                                    <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0"/><span><strong>Vivienda real:</strong> Filtros, documentación y alertas para evitar estafas.</span></li>
                                    <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0"/><span><strong>Papeles en regla:</strong> Rutas legales claras para tu caso (estudios, trabajo, arraigo).</span></li>
                                </ul>
                            </div>
                            
                            <div className="flex items-center justify-center lg:col-span-2">
                                <div className="w-full max-w-2xl aspect-video rounded-xl shadow-lg overflow-hidden transition-all duration-300 relative group hover:shadow-2xl">
                                {showVideo ? (
                                        <video
                                            className="w-full h-full object-cover"
                                            controls
                                            autoPlay
                                            src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2Fvaleria.mp4?alt=media&token=676a4910-9fc7-4e7b-ad39-9f1cb313b2b5"
                                        >
                                            Tu navegador no soporta la etiqueta de video.
                                        </video>
                                ) : (
                                    <button 
                                        onClick={() => setShowVideo(true)}
                                        className="w-full h-full relative"
                                        aria-label="Play Valeria's Video"
                                    >
                                        <Image 
                                            src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2Fvaleria_avatar_horizontal.jpg?alt=media&token=ad7b4b6a-8c97-4984-b480-b4ed38936e1a"
                                            alt="Video de presentación de Valeria"
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                                            <PlayCircle className="w-24 h-24 text-white/80 drop-shadow-lg transition-transform group-hover:scale-110 group-hover:text-white" />
                                        </div>
                                    </button>
                                )}
                                </div>
                            </div>
                        </div>

                        {/* --- Comparison Table & CTA --- */}
                        <div>
                            <div className="border rounded-xl shadow-lg bg-card max-w-6xl mx-auto">
                                <div className="grid grid-cols-3">
                                    <div className="p-4 sm:p-6 border-r"><h3 className="font-bold h-12 flex items-end">Características</h3></div>
                                    <div className="p-4 sm:p-6 border-r text-center"><h3 className="font-bold h-12 flex items-end justify-center">Gratis</h3></div>
                                    <div className="p-4 sm:p-6 text-center bg-primary/5 rounded-tr-xl"><h3 className="font-bold h-12 flex items-end justify-center text-primary">Premium</h3></div>
                                </div>
                                {allFeatures.map((feature) => (
                                    <div key={feature.key} className="grid grid-cols-3 border-t">
                                        <div className="p-4 sm:p-6 border-r flex items-center">{feature.label}</div>
                                        <div className="p-4 sm:p-6 border-r flex items-center justify-center">
                                            {typeof featureData[feature.key].free === 'boolean' ? (
                                                featureData[feature.key].free ? <Check className="h-6 w-6 text-green-500"/> : <div className="h-6 w-6 flex items-center justify-center text-muted-foreground">-</div>
                                            ) : <span className="font-semibold text-sm">{featureData[feature.key].free}</span>}
                                        </div>
                                        <div className="p-4 sm:p-6 flex items-center justify-center bg-primary/5">
                                            {typeof featureData[feature.key].premium === 'boolean' ? (
                                                featureData[feature.key].premium ? <Check className="h-6 w-6 text-green-500"/> : <div className="h-6 w-6 flex items-center justify-center text-muted-foreground">-</div>
                                            ) : <span className="font-semibold text-primary text-sm">{featureData[feature.key].premium}</span>}
                                        </div>
                                    </div>
                                ))}
                                <div className="grid grid-cols-3 border-t">
                                    <div className="p-4 sm:p-6 border-r flex items-center justify-center"></div>
                                    <div className="p-4 sm:p-6 border-r text-center space-y-2">
                                        <p className="text-2xl font-bold">Gratis</p>
                                        <Button variant="outline" className="w-full" onClick={() => handlePlanSelection(valeriaPlans[0])}>{valeriaPlans[0].cta}</Button>
                                    </div>
                                    <div className="p-4 sm:p-6 text-center space-y-2 bg-primary/5">
                                        <p className="text-2xl font-bold">4,97€<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                                        <Button className="w-full" onClick={() => handlePlanSelection(valeriaPlans[1])}>Comprar Premium</Button>
                                    </div>
                                </div>
                                 <div className="grid grid-cols-3 border-t rounded-b-xl">
                                    <div className="col-span-1 p-4 sm:p-6 border-r"></div>
                                    <div className="col-span-2 p-4 sm:p-6 rounded-br-xl bg-primary/5">
                                        <button 
                                            onClick={() => handlePlanSelection(valeriaPlans[2])}
                                            className="w-full p-3 text-left rounded-lg transition-all transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                            style={{
                                                background: 'linear-gradient(to right, hsl(var(--primary)/0.05), hsl(var(--primary)/0.15))',
                                                border: '1px solid',
                                                borderImageSource: 'linear-gradient(to right, #FFCD00, #C70039, #003893)',
                                                borderImageSlice: 1
                                            }}
                                        >
                                            <div className="text-center">
                                                <p className="font-bold text-primary">Oferta Lanzamiento</p>
                                                <p className="font-semibold text-foreground">Lanzamiento 3 meses por sólo 9,97€ <ArrowRight className="inline-block ml-1 h-4 w-4"/></p>
                                                <p className="text-sm font-bold text-yellow-500 mt-1">¡Ahorra un 33%!</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 text-center">
                                <Button variant="link" asChild className="text-primary">
                                    <Link href="/valeria">Ver todas las características y preguntas frecuentes <ArrowRight className="ml-1 h-4 w-4"/></Link>
                                </Button>
                            </div>
                            <Card className="mt-4 bg-secondary/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0"/>
                                        <p className="text-xs text-muted-foreground">
                                            Valeria es una herramienta informativa basada en IA. No constituye asesoramiento jurídico. Para decisiones legales, consulta siempre a un profesional colegiado.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
            <CheckoutSheet
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                plan={selectedPlan}
            />
        </>
    );
}
