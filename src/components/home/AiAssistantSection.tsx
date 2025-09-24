
'use client';

import { Button } from "@/components/ui/button";
import { MessageCircle, Check } from "lucide-react";
import Link from "next/link";
import { valeriaPlans } from "@/lib/placeholder-data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import CheckoutSheet from "../checkout/CheckoutSheet";
import { useToast } from "@/hooks/use-toast";
import { createSubscriptionCheckoutSessionAction } from "@/lib/payment-actions";
import { useState } from "react";
import type { ValeriaPlan } from "@/lib/types";

export default function AiAssistantSection({ onOpenChatModal }: { onOpenChatModal: () => void }) {
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

    return (
        <>
            <section id="asistente-ia" className="w-full py-12 md:py-24 lg:py-32 bg-secondary dark:bg-card">
                <div className="container px-4 md:px-6 max-w-6xl">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Asistente IA</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                            Con Valeria nunca estarás solo
                        </h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                           Tu asesora IA 24/7. Gratis para empezar, y con planes Premium que incluyen alertas de empleo, vivienda y guías exclusivas para que tu proceso sea aún más fácil.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Columna Izquierda: Video y Planes */}
                        <div className="space-y-8">
                            <div className="w-full aspect-video rounded-xl shadow-lg overflow-hidden">
                                <video
                                    className="w-full h-full object-cover"
                                    src="https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2Fvaleria.mp4?alt=media&token=676a4910-9fc7-4e7b-ad39-9f1cb313b2b5"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            </div>
                        </div>

                        {/* Columna Derecha: Tarjetas de Precios */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 items-start">
                             {valeriaPlans.map((plan) => (
                                <Card 
                                    key={plan.name} 
                                    className={cn(
                                        "flex flex-col shadow-lg transition-shadow duration-300 w-full", 
                                        plan.name === "Valeria Premium" && "border-primary border-2 shadow-primary/20"
                                    )}
                                >
                                    {plan.name === "Valeria Premium" && (
                                        <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs font-semibold">
                                            Recomendado
                                        </div>
                                    )}
                                    <CardHeader className="items-center text-center">
                                        <CardTitle className="font-headline text-xl">{plan.name}</CardTitle>
                                        <div className="flex items-baseline">
                                            <span className="text-3xl font-bold">{typeof plan.price === 'number' ? `${plan.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€` : plan.price}</span>
                                            <span className="text-muted-foreground ml-1 text-sm">{plan.priceDetails}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <ul className="space-y-3 text-sm">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-start">
                                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
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
