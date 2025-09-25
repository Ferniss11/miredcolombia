
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle, PlayCircle, X } from "lucide-react";
import Link from "next/link";
import { valeriaPlans } from "@/lib/placeholder-data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import CheckoutSheet from "../checkout/CheckoutSheet";
import { useToast } from "@/hooks/use-toast";
import { createSubscriptionCheckoutSessionAction } from "@/lib/payment-actions";
import type { ValeriaPlan } from "@/lib/types";

type AiAssistantSectionProps = {
    onOpenChatModal: () => void;
    variant?: 'full' | 'compact';
};

const allFeatures = [
    { key: 'consultas', label: 'Consultas al mes' },
    { key: 'base_conocimiento', label: 'Base de conocimiento' },
    { key: 'analisis_documentos', label: 'Análisis de documentos' },
    { key: 'alertas', label: 'Alertas de empleo y vivienda' },
];

const featureData: { [key: string]: { free: string | boolean; premium: string | boolean } } = {
    consultas: { free: 'Hasta 3', premium: 'Ilimitadas' },
    base_conocimiento: { free: true, premium: true },
    analisis_documentos: { free: false, premium: true },
    alertas: { free: false, premium: true },
};


export default function AiAssistantSection({ onOpenChatModal, variant = 'full' }: AiAssistantSectionProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<ValeriaPlan | null>(null);

    const handlePlanSelection = async (plan: ValeriaPlan) => {
        if (!user) {
          if (plan.id === 'plan_free') {
            onOpenChatModal();
          } else {
            setSelectedPlan(plan);
            setIsSheetOpen(true);
          }
          return;
        }

        if (plan.id === 'plan_free') {
            onOpenChatModal();
        } else {
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
        }
    };
    
    const isFullVariant = variant === 'full';

    return (
        <>
            <section id="asistente-ia" className={cn("w-full", isFullVariant ? "py-12 md:py-24 lg:py-32 bg-secondary dark:bg-card" : "py-12 md:py-24 bg-background")}>
                <div className="container px-4 md:px-6 max-w-5xl">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Asistente IA</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                           {isFullVariant ? "Con Valeria nunca estarás solo" : "Potencia tu Migración con Valeria"}
                        </h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                           Tu asesora IA 24/7. Gratis para empezar, y con un plan Premium que desbloquea todo su potencial para que tu proceso sea aún más fácil.
                        </p>
                    </div>
                    
                    {isFullVariant ? (
                        <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-8">
                            <div className="w-full aspect-video rounded-xl shadow-lg overflow-hidden">
                                <video
                                    className="w-full h-full object-cover"
                                    src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2Fvaleria.mp4?alt=media&token=676a4910-9fc7-4e7b-ad39-9f1cb313b2b5"
                                    controls
                                    controlsList="nodownload"
                                    playsInline
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {valeriaPlans.map((plan) => (
                                    <Card 
                                        key={plan.name} 
                                        className={cn(
                                            "flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300 h-full", 
                                            plan.name === "Valeria Premium" && "border-primary border-2 shadow-primary/20"
                                        )}
                                    >
                                        {plan.name === "Valeria Premium" && (
                                        <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-semibold">
                                            Recomendado
                                        </div>
                                        )}
                                        <CardHeader className="items-center text-center">
                                            <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                                            <div className="flex items-baseline">
                                                <span className="text-4xl font-bold">{typeof plan.price === 'number' ? `${plan.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€` : plan.price}</span>
                                                <span className="text-muted-foreground ml-1">{plan.priceDetails}</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <ul className="space-y-4">
                                                {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-start">
                                                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full" variant={plan.variant as any} onClick={() => handlePlanSelection(plan)}>
                                                {plan.cta}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : (
                         <div className="w-full max-w-4xl mx-auto overflow-x-auto">
                            <div className="border rounded-xl shadow-lg bg-card min-w-[600px]">
                                <div className="grid grid-cols-3">
                                    <div className="p-4 sm:p-6 border-r">
                                        <h3 className="font-bold h-12 flex items-end">Características</h3>
                                    </div>
                                    <div className="p-4 sm:p-6 border-r text-center">
                                        <h3 className="font-bold h-12 flex items-end justify-center">{valeriaPlans[0].name}</h3>
                                    </div>
                                    <div className="p-4 sm:p-6 text-center bg-primary/5 rounded-tr-xl">
                                        <h3 className="font-bold h-12 flex items-end justify-center text-primary">{valeriaPlans[1].name}</h3>
                                    </div>
                                </div>
                                
                                {allFeatures.map((feature, index) => (
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

                                <div className="grid grid-cols-3 border-t">
                                    <div className="p-4 sm:p-6 border-r flex items-center font-bold">Precio</div>
                                    <div className="p-4 sm:p-6 border-r flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold">{valeriaPlans[0].price}</span>
                                        <span className="text-xs text-muted-foreground">{valeriaPlans[0].priceDetails}</span>
                                    </div>
                                    <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-primary/5">
                                        <span className="text-2xl font-bold text-primary">{valeriaPlans[1].price}€</span>
                                        <span className="text-xs text-muted-foreground">{valeriaPlans[1].priceDetails}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 border-t rounded-b-xl">
                                    <div className="p-4 sm:p-6 border-r"></div>
                                    <div className="p-4 sm:p-6 border-r flex items-center justify-center">
                                        <Button variant="outline" className="w-full" onClick={() => handlePlanSelection(valeriaPlans[0])}>
                                            {valeriaPlans[0].cta}
                                        </Button>
                                    </div>
                                    <div className="p-4 sm:p-6 flex items-center justify-center bg-primary/5 rounded-br-xl">
                                        <Button className="w-full" onClick={() => handlePlanSelection(valeriaPlans[1])}>
                                            {valeriaPlans[1].cta}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
