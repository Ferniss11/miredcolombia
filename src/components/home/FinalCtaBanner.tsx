
'use client';

import { useAuth } from "@/context/AuthContext";
import { createSubscriptionCheckoutSessionAction } from "@/lib/payment-actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FinalCtaBanner() {
    const { user } = useAuth();
    const { toast } = useToast();

    const handleCheckout = async (planId: 'valeria_premium' | 'valeria_premium_quarterly') => {
        if (!user) {
            toast({
                title: "Necesitas una cuenta",
                description: "Por favor, regístrate o inicia sesión para suscribirte.",
                action: <Button asChild><Link href="/signup">Registrarse</Link></Button>,
            });
            return;
        }

        const result = await createSubscriptionCheckoutSessionAction({
            planId,
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
        <section className="w-full py-20 bg-primary text-primary-foreground">
            <div className="container text-center">
                 <h2 className="text-3xl md:text-4xl font-extrabold font-headline">Tu puente de Colombia a España empieza hoy.</h2>
                 <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                     <Button size="lg" variant="secondary" className="text-lg h-12 px-8" onClick={() => handleCheckout('valeria_premium')}>
                        <ArrowRight className="mr-2 h-5 w-5" /> Comprar Premium por 4,97 €/mes
                    </Button>
                    <div className="flex flex-col items-center">
                        <Button size="lg" variant="secondary" className="text-lg h-12 px-8" onClick={() => handleCheckout('valeria_premium_quarterly')}>
                           Lanzamiento 3 meses por sólo 9,97€
                        </Button>
                        <p className="text-xs font-bold text-yellow-300 mt-1">¡Ahorra un 33%!</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
