
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "../ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createSubscriptionCheckoutSessionAction } from "@/lib/payment-actions";
import { useState } from "react";
import CheckoutSheet from "../checkout/CheckoutSheet";
import type { ValeriaPlan } from "@/lib/types";

const faqs = [
    {
        question: "¿Valeria sustituye a un abogado?",
        answer: "No. Valeria no es asesoría legal personalizada ni sustituye a un profesional colegiado. Te ofrece información actualizada, rutas y plantillas para que avances con seguridad y sepas cuándo y a quién acudir.",
    },
    {
        question: "¿La información está al día?",
        answer: "Valeria se entrena con normativa y procedimientos vigentes en España y buenas prácticas. Si una regla cambia, te lo señala y te propone el nuevo paso a paso.",
    },
    {
        question: "¿Puedo cancelar cuando quiera?",
        answer: "Sí, el plan mensual es sin permanencia. El pack 3 meses es promocional y no fraccionable.",
    },
    {
        question: "¿Qué pasa si mi caso es complejo?",
        answer: "Valeria te da el mapa y te avisa cuando conviene elevar tu caso a un abogado/gestor. También te ayuda a preparar la consulta (documentos y preguntas clave).",
    },
    {
        question: "¿Sirve si todavía estoy en Colombia?",
        answer: "Sí. Incluye “antes de viajar”: documentos a traer, apostillas, convalidaciones, gastos reales y cómo ahorrar tiempo y dinero al llegar.",
    },
];

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


export default function FaqCtaSection() {
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
            <section className="w-full py-20 md:py-32 bg-secondary/30 dark:bg-card/30">
                <div className="container max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        {/* Left Column: FAQs */}
                        <div>
                            <h2 className="text-3xl font-bold font-headline mb-6">Preguntas Frecuentes</h2>
                            <Accordion type="single" collapsible className="w-full">
                                {faqs.map((faq, index) => (
                                    <AccordionItem key={index} value={`item-${index + 1}`}>
                                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                                        <AccordionContent>{faq.answer}</AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>

                        {/* Right Column: CTA */}
                        <div className="bg-card p-8 rounded-lg shadow-lg">
                            <h3 className="text-2xl font-bold font-headline mb-6">Tu puente de Colombia a España empieza hoy.</h3>
                            <div className="flex flex-col gap-4">
                                <Button size="lg" className="w-full justify-between h-14 text-base" onClick={() => handlePlanSelection('premium')}>
                                    <span><Sparkles className="inline-block mr-2 h-5 w-5"/>Empezar con Valeria</span>
                                    <span className="flex items-center">
                                        4,97€/mes <ArrowRight className="ml-2 h-4 w-4"/>
                                    </span>
                                </Button>
                                <Button size="lg" variant="outline" className="w-full justify-between h-14 text-base" onClick={() => handlePlanSelection('quarterly')}>
                                    <span>Aprovechar 3 meses</span>
                                    <span className="flex items-center">
                                        9,97€ <ArrowRight className="ml-2 h-4 w-4"/>
                                    </span>
                                </Button>
                                <Button size="lg" variant="outline" className="w-full justify-between h-14 text-base" asChild>
                                    <a href="https://www.viajamor.com/viaje/asesoria-viajes-90-minutos/" target="_blank" rel="noopener noreferrer">
                                        <span>Reservar Consultoría</span>
                                        <span className="flex items-center">
                                            39€ <ArrowRight className="ml-2 h-4 w-4"/>
                                        </span>
                                    </a>
                                </Button>
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
