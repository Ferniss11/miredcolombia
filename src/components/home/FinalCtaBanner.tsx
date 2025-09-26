
'use client';

import React, { useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import CheckoutSheet from '../checkout/CheckoutSheet';
import type { ValeriaPlan } from '@/lib/types';

// Define plans here to pass to the sheet
const valeriaPlans: { [key: string]: ValeriaPlan } = {
  premium: {
    id: 'valeria_premium',
    name: 'Valeria Premium (Mensual)',
    price: 4.97,
    priceDetails: '/ mes',
    features: [
      'Consultas ilimitadas',
      'Respuestas extendidas y detalladas',
      'Análisis de documentos',
      'Acceso a plantillas y checklists',
    ],
    cta: 'Comprar Premium',
    variant: 'default',
  },
  quarterly: {
    id: 'valeria_premium_quarterly',
    name: 'Valeria Premium (Promoción Trimestral)',
    price: 9.97,
    priceDetails: '/ 3 meses',
    features: [
      'Un solo pago',
      'Acceso completo a todas las funciones Premium',
      'Ahorra un 33% sobre el precio mensual',
    ],
    cta: 'Aprovechar Oferta',
    variant: 'default',
  }
};


export default function FinalCtaBanner() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<ValeriaPlan | null>(null);

    const handlePlanSelection = (planKey: 'premium' | 'quarterly') => {
        const plan = valeriaPlans[planKey];
        setSelectedPlan(plan);
        setIsSheetOpen(true);
    };

    return (
        <>
            <section className="w-full py-8 text-black bg-[#ffc105] shadow-[inset_12px_12px_24px_#edb305,inset_-12px_-12px_24px_#ffcf05]">
                <div className="container text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold font-headline">Tu puente de Colombia a España empieza hoy.</h2>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" variant="secondary" className="text-lg h-12 px-8" onClick={() => handlePlanSelection('premium')}>
                            <ArrowRight className="mr-2 h-5 w-5" /> Comprar Premium por 4,97 €/mes
                        </Button>
                        <div className="relative">
                            <Button size="lg" variant="secondary" className="text-lg h-12 px-8 w-full" onClick={() => handlePlanSelection('quarterly')}>
                                Lanzamiento 3 meses por sólo 9,97€
                            </Button>
                            <div className="absolute -top-3 -right-3 transform rotate-12 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded shadow-lg">
                                ¡Ahorra un 33%!
                            </div>
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
