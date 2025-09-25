
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, MessageSquare, Shield, PlayCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createSubscriptionCheckoutSessionAction } from "@/lib/payment-actions";
import type { ValeriaPlan } from "@/lib/types";
import Link from "next/link";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";

const valeriaPlans: ValeriaPlan[] = [
    {
      id: 'plan_free',
      name: 'Gratis',
      price: 0,
      priceDetails: '',
      features: [],
      cta: 'Chatear Gratis',
      variant: 'outline'
    },
    {
      id: 'valeria_premium',
      name: 'Valeria Premium',
      price: 4.99,
      priceDetails: '/mes',
      features: [],
      cta: 'Probar Premium',
      variant: 'default'
    },
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

    const handlePlanSelection = async (plan: ValeriaPlan) => {
        if (plan.id === 'plan_free') {
            onOpenChatModal();
            return;
        }
        
        if (!user) {
            toast({
                title: "Necesitas una cuenta",
                description: "Por favor, regístrate o inicia sesión para suscribirte.",
                action: <Button asChild><Link href="/signup">Registrarse</Link></Button>,
            });
            return;
        }

        const result = await createSubscriptionCheckoutSessionAction({
            planId: plan.id,
            userId: user.uid,
            userEmail: user.email!,
        });

        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Error al Iniciar Pago',
                description: result.error,
            });
        } else if (result.checkoutUrl) {
            window.location.href = result.checkoutUrl;
        }
    };
    
    return (
        <section id="asistente-ia" className="w-full py-12 md:py-24 lg:py-32 bg-background">
            <div className="container max-w-6xl mx-auto px-4 md:px-6 space-y-16">
                
                {/* --- Main Info & Video --- */}
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
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
                        <div className="pt-2">
                            <Button size="lg" onClick={onOpenChatModal}>
                                <MessageSquare className="mr-2 h-5 w-5"/> Hablar con Valeria
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                         <div className="w-full max-w-md aspect-video rounded-xl shadow-lg overflow-hidden transition-all duration-300 relative group hover:shadow-2xl">
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
                                    src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2Fvaleria-cover.jpg?alt=media&token=86d52253-176c-4856-96a9-83955d5b306b"
                                    alt="Video de presentación de Valeria"
                                    layout="fill"
                                    objectFit="cover"
                                    className="transition-transform duration-500 group-hover:scale-110"
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
                    <div className="border rounded-xl shadow-lg bg-card">
                        <div className="grid grid-cols-3">
                            <div className="p-4 sm:p-6 border-r"><h3 className="font-bold h-12 flex items-end">Características</h3></div>
                            <div className="p-4 sm:p-6 border-r text-center"><h3 className="font-bold h-12 flex items-end justify-center">{valeriaPlans[0].name}</h3></div>
                            <div className="p-4 sm:p-6 text-center bg-primary/5 rounded-tr-xl"><h3 className="font-bold h-12 flex items-end justify-center text-primary">{valeriaPlans[1].name}</h3></div>
                        </div>
                        {allFeatures.map((feature) => (
                            <div key={feature.key} className="grid grid-cols-3 border-t">
                                <div className="p-4 sm:p-6 border-r flex items-center">{feature.label}</div>
                                <div className="p-4 sm:p-6 border-r flex items-center justify-center">
                                    {typeof featureData[feature.key].free === 'boolean' ? (
                                        featureData[feature.key].free ? <Check className="h-6 w-6 text-green-500"/> : <X className="h-6 w-6 text-muted-foreground"/>
                                    ) : <span className="font-semibold text-sm">{featureData[feature.key].free}</span>}
                                </div>
                                <div className="p-4 sm:p-6 flex items-center justify-center bg-primary/5">
                                    {typeof featureData[feature.key].premium === 'boolean' ? (
                                        featureData[feature.key].premium ? <Check className="h-6 w-6 text-green-500"/> : <X className="h-6 w-6 text-muted-foreground"/>
                                    ) : <span className="font-semibold text-primary text-sm">{featureData[feature.key].premium}</span>}
                                </div>
                            </div>
                        ))}
                        <div className="grid grid-cols-3 border-t rounded-b-xl">
                            <div className="p-4 sm:p-6 border-r flex flex-col justify-center">
                               <Button variant="link" asChild className="p-0 justify-start">
                                    <Link href="/valeria">Ver todas las características <ArrowRight className="ml-1 h-4 w-4"/></Link>
                                </Button>
                            </div>
                            <div className="p-4 sm:p-6 border-r flex items-center justify-center">
                                <Button variant="outline" className="w-full" onClick={() => handlePlanSelection(valeriaPlans[0])}>{valeriaPlans[0].cta}</Button>
                            </div>
                            <div className="p-4 sm:p-6 flex items-center justify-center bg-primary/5 rounded-br-xl">
                                <Button className="w-full" onClick={() => handlePlanSelection(valeriaPlans[1])}>{valeriaPlans[1].cta}</Button>
                            </div>
                        </div>
                    </div>
                     <Card className="mt-8 bg-secondary/50">
                        <CardContent className="p-4">
                             <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0"/>
                                <p className="text-xs text-muted-foreground">
                                    Valeria es una herramienta informativa basada en IA y no constituye asesoramiento jurídico. Para decisiones legales específicas, consulta siempre a un profesional colegiado.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
