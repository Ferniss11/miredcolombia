
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "../ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createSubscriptionCheckoutSessionAction } from "@/lib/payment-actions";

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

export default function FaqCtaSection() {
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
                             <Button size="lg" className="w-full justify-between h-14 text-base" onClick={() => handleCheckout('valeria_premium')}>
                                <span><Sparkles className="inline-block mr-2 h-5 w-5"/>Empezar con Valeria</span>
                                <span className="flex items-center">
                                    4,97€/mes <ArrowRight className="ml-2 h-4 w-4"/>
                                </span>
                            </Button>
                             <Button size="lg" variant="outline" className="w-full justify-between h-14 text-base" onClick={() => handleCheckout('valeria_premium_quarterly')}>
                                <span>Aprovechar 3 meses</span>
                                 <span className="flex items-center">
                                    9,97€ <ArrowRight className="ml-2 h-4 w-4"/>
                                </span>
                            </Button>
                             <Button size="lg" variant="outline" className="w-full justify-between h-14 text-base" asChild>
                                <Link href="/checkout/pack_consultoria">
                                    <span>Reservar Consultoría</span>
                                     <span className="flex items-center">
                                        39€ <ArrowRight className="ml-2 h-4 w-4"/>
                                    </span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
