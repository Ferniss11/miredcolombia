
'use client';

import React, { Suspense, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check, User, Target, Shield, Users, HelpCircle, ArrowRight, Star } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { createSubscriptionCheckoutSessionAction } from '@/lib/payment-actions';
import { cn } from '@/lib/utils';
import type { ValeriaPlan } from '@/lib/types';


const ValuePropItem = ({ icon: Icon, children }: { icon: React.ElementType, children: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-full">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-lg text-muted-foreground">{children}</p>
        </div>
    </div>
);

const HowItWorksStep = ({ number, title, description }: { number: string, title: string, description: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex-shrink-0">
            {number}
        </div>
        <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
);

const WhoIsItForCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <Card className="text-center h-full">
        <CardContent className="p-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold font-headline text-xl">{title}</h3>
            <p className="text-muted-foreground mt-2">{description}</p>
        </CardContent>
    </Card>
);

const TestimonialCard = ({ text, author }: { text: string, author: string }) => (
     <Card className="bg-background">
        <CardContent className="p-6">
            <div className="flex gap-1 text-yellow-400 mb-2">
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
            </div>
            <blockquote className="text-lg italic">“{text}”</blockquote>
            <p className="mt-4 font-semibold text-right">- {author}</p>
        </CardContent>
    </Card>
);

function ValeriaPageContent() {
    const { user } = useAuth();
    const { toast } = useToast();

    const handleCheckout = async (planId: 'monthly' | 'quarterly') => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión o crear una cuenta para suscribirte.' });
            return;
        }
        
        const internalPlanId = planId === 'monthly' ? 'valeria_premium' : 'valeria_premium_quarterly';

        const result = await createSubscriptionCheckoutSessionAction({
            planId: internalPlanId,
            userId: user.uid,
            userEmail: user.email!,
        });

        if (result.error || !result.checkoutUrl) {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'No se pudo crear la sesión de pago.' });
        } else {
            window.location.href = result.checkoutUrl;
        }
    };

    return (
        <div className="bg-secondary/30 dark:bg-card/30">
            {/* --- HERO SECTION --- */}
            <section className="py-20 text-center">
                <div className="container max-w-4xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight">Tu Puente de Colombia a España Empieza Hoy</h1>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="text-lg h-12 px-8" onClick={() => handleCheckout('monthly')}>
                           Comprar Premium por 4,97 €/mes
                        </Button>
                        <Button size="lg" variant="outline" className="text-lg h-12 px-8" onClick={() => handleCheckout('quarterly')}>
                           Oferta: 3 meses por 9,97 €
                        </Button>
                    </div>
                    <p className="text-muted-foreground text-sm mt-4">
                        Actualizada con normativa española vigente · Guías prácticas · Lenguaje claro · Cancelas cuando quieras
                    </p>
                </div>
            </section>

            {/* --- VALUE PROPOSITION --- */}
            <section className="py-20 bg-background">
                <div className="container max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                   <ValuePropItem icon={Check}>Consigue <strong>empleo legal</strong>: CV optimizado para España, portales que sí funcionan y pasos para contratos sin fraudes.</ValuePropItem>
                   <ValuePropItem icon={Check}>Encuentra <strong>vivienda real</strong>: filtros, documentación que piden las inmobiliarias y cómo evitar estafas.</ValuePropItem>
                   <ValuePropItem icon={Check}><strong>Papeles en regla</strong>: rutas legales para tu caso (estudios, trabajo, arraigo, familiar, etc.), requisitos y citas.</ValuePropItem>
                   <ValuePropItem icon={Check}>Todo <strong>explicado fácil</strong>: listas de verificación, plantillas y mensajes listos para enviar.</ValuePropItem>
                </div>
            </section>
            
            {/* --- HOW IT WORKS --- */}
            <section className="py-20">
                 <div className="container max-w-4xl">
                    <h2 className="text-3xl font-bold text-center mb-12 font-headline">¿Cómo te ayuda Valeria?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <HowItWorksStep number="1" title="Dime tu situación" description="Cuéntale tu perfil, ciudad de destino y tu objetivo principal." />
                       <HowItWorksStep number="2" title="Recibe un plan paso a paso" description="Obtén un plan claro sobre qué hacer hoy, esta semana y este mes." />
                       <HowItWorksStep number="3" title="Ejecuta con plantillas" description="Usa emails, formularios, CVs y mensajes listos para enviar." />
                       <HowItWorksStep number="4" title="Accede a recursos verificados" description="Consigue enlaces útiles y recordatorios clave para citas, plazos y documentos." />
                    </div>
                </div>
            </section>

            {/* --- FOR WHOM --- */}
             <section className="py-20 bg-background">
                <div className="container max-w-5xl">
                    <h2 className="text-3xl font-bold text-center mb-12 font-headline">Perfecto para...</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <WhoIsItForCard icon={User} title="Recién Llegados" description="Quienes van a emigrar o acaban de llegar a España." />
                        <WhoIsItForCard icon={Target} title="Buscando Orden" description="Quien necesita un plan claro para papeles, empleo y vivienda." />
                        <WhoIsItForCard icon={Shield} title="Evitando Estafas" description="Quien quiere evitar fraudes con alquileres o 'contratos fantasma'." />
                        <WhoIsItForCard icon={Users} title="Equipos de Apoyo" description="Quienes atienden a migrantes y necesitan respuestas rápidas y consistentes." />
                    </div>
                </div>
            </section>
            
            {/* --- PRICING --- */}
            <section className="py-20">
                <div className="container max-w-4xl">
                    <h2 className="text-3xl font-bold text-center mb-12 font-headline">Precios Flexibles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle>Plan Mensual</CardTitle>
                                <CardDescription>Acceso completo, sin permanencia.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-5xl font-bold">4,97€<span className="text-lg font-normal text-muted-foreground">/mes</span></p>
                                <p className="text-sm text-muted-foreground mt-2">Menos de lo que cuesta un café a la semana.</p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => handleCheckout('monthly')}>Empezar Ahora por 4,97€</Button>
                            </CardFooter>
                        </Card>
                         <Card className="border-primary border-2 flex flex-col relative">
                             <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full">Oferta Lanzamiento</div>
                            <CardHeader>
                                <CardTitle>Pack 3 Meses</CardTitle>
                                <CardDescription>Ideal para cubrir preparación y llegada.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-5xl font-bold">9,97€<span className="text-lg font-normal text-muted-foreground">/pago único</span></p>
                                <p className="text-sm text-muted-foreground mt-2">Equivale a 3,32€/mes. ¡Ahorra!</p>
                            </CardContent>
                             <CardFooter>
                                <Button className="w-full" variant="default" onClick={() => handleCheckout('quarterly')}>Aprovechar Oferta 3 Meses</Button>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        <p><strong>Garantía de tranquilidad:</strong> Si en los primeros 7 días sientes que Valeria no te aporta claridad, te ayudamos a ajustar tu plan (y si no te encaja, cancelas sin lío).</p>
                    </div>
                </div>
            </section>

             {/* --- TESTIMONIALS --- */}
             <section className="py-20 bg-background">
                 <div className="container max-w-5xl">
                    <h2 className="text-3xl font-bold text-center mb-12 font-headline">Opiniones (Reales Próximamente)</h2>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <TestimonialCard text="En 72 horas tenía plan y CV al estilo España. Me ahorré semanas de búsqueda a ciegas." author="Usuario Piloto 1"/>
                        <TestimonialCard text="Evité una estafa de habitación patera gracias a las alertas." author="Usuario Piloto 2"/>
                        <TestimonialCard text="Su checklist de llegada me salvó con el empadronamiento y la cita." author="Usuario Piloto 3"/>
                    </div>
                </div>
            </section>

             {/* --- FAQ --- */}
            <section className="py-20">
                <div className="container max-w-3xl">
                    <h2 className="text-3xl font-bold text-center mb-12 font-headline">Preguntas Frecuentes</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>¿Valeria sustituye a un abogado?</AccordionTrigger>
                            <AccordionContent>No. Valeria no es asesoría legal personalizada ni sustituye a un profesional colegiado. Te ofrece información actualizada, rutas y plantillas para que avances con seguridad y sepas cuándo y a quién acudir.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>¿La información está al día?</AccordionTrigger>
                            <AccordionContent>Valeria se entrena con normativa y procedimientos vigentes en España y buenas prácticas. Si una regla cambia, te lo señala y te propone el nuevo paso a paso.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>¿Puedo cancelar cuando quiera?</AccordionTrigger>
                            <AccordionContent>Sí, el plan mensual es sin permanencia. El pack 3 meses es promocional y no fraccionable.</AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-4">
                            <AccordionTrigger>¿Qué pasa si mi caso es complejo?</AccordionTrigger>
                            <AccordionContent>Valeria te da el mapa y te avisa cuando conviene elevar tu caso a un abogado/gestor. También te ayuda a preparar la consulta (documentos y preguntas clave).</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                            <AccordionTrigger>¿Sirve si todavía estoy en Colombia?</AccordionTrigger>
                            <AccordionContent>Sí. Incluye “antes de viajar”: documentos a traer, apostillas, convalidaciones, gastos reales y cómo ahorrar tiempo y dinero al llegar.</AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>
            
            {/* --- FINAL CTA --- */}
             <section className="py-20 bg-primary text-primary-foreground">
                <div className="container text-center">
                     <h2 className="text-3xl md:text-4xl font-extrabold font-headline">Tu puente de Colombia a España empieza hoy.</h2>
                     <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                         <Button size="lg" variant="secondary" className="text-lg h-12 px-8" onClick={() => handleCheckout('monthly')}>
                            <ArrowRight className="mr-2 h-5 w-5" /> Comprar Premium por 4,97 €/mes
                        </Button>
                        <Button size="lg" variant="outline" className="text-lg h-12 px-8 border-white text-white hover:bg-white hover:text-primary" onClick={() => handleCheckout('quarterly')}>
                           Oferta: 3 meses por 9,97 €
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function ValeriaPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ValeriaPageContent />
        </Suspense>
    );
}
