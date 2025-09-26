
'use client';

import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Briefcase, Plane, CheckCircle, ArrowRight, Bot, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import RequestQuoteSheet from "./RequestQuoteSheet";
import { Separator } from "../ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useChat } from "@/context/ChatContext";

const packs = [
    {
        icon: MessageSquare,
        title: "Consultoría Inicial",
        price: "39€",
        id: "pack_consultoria",
        description: "Resuelve tus dudas clave en una videollamada y sal con un plan de acción en 7 días.",
        features: [
            "Revisión de tu caso y objetivos",
            "Ruta priorizada (papeles, empleo o vivienda)",
            "Checklist inmediato + plantillas clave",
            "Recomendación de siguientes pasos (con/ sin pack)",
        ],
        cta: "Reservar Consultoría",
        microcopy: "30–45 min · entregable con plan de 7 días",
        actionType: "link" as const,
        link: "https://www.viajamor.com/viaje/asesoria-viajes-90-minutos/",
    },
    {
        icon: Briefcase,
        title: "Onboarding en España",
        price: "A tu medida",
        id: "pack_onboarding",
        description: "Te recibimos en tus primeros 30 días para que todo salga a la primera.",
        features: [
            "Empadronamiento y citas",
            "Apertura de cuenta / SIM / seguro",
            "Apoyo en vivienda (documentos, mensajes, visita)",
            "Preparación de entrevistas y contratos",
        ],
        cta: "Pedir presupuesto",
        microcopy: "Disponibilidad agenda en 5–7 días",
        actionType: "modal" as const,
    },
    {
        icon: Plane,
        title: "Viaje Completo",
        price: "Personalizado",
        id: "pack_viaje",
        description: "De Colombia a tu nueva casa en España con acompañamiento de principio a fin.",
        features: [
            "Lista de documentos y apostillas antes de viajar",
            "Vuelo, llegada y traslado (opcional)",
            "Búsqueda de vivienda y onboarding administrativo",
            "Escolarización de hijos / alta sanitaria (si aplica)",
        ],
        cta: "Solicitar propuesta",
        microcopy: "Plan y timeline antes de pagar el total",
        actionType: "modal" as const,
    }
];

const howItWorksSteps = [
    { text: "Diagnóstico rápido (formulario + Valeria)" },
    { text: "Sesión de arranque con tu especialista" },
    { text: "Ejecución guiada + documentos revisados" },
    { text: "Cierre con entregables (checklist, citas, etc.)" },
];

const signals = [
    "Te rechazan citas o formularios por detalles técnicos.",
    "Dudas entre dos vías legales y temes equivocarte.",
    "Necesitas respuesta rápida de vivienda (evitar estafas).",
    "Vas a emprender o contratar y quieres hacerlo legal.",
];


export default function PackagesSection() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState('');
    const { openChat } = useChat();

    const handleAction = (pkg: typeof packs[0]) => {
        if (pkg.actionType === 'modal') {
            setSelectedPackage(pkg.title);
            setIsSheetOpen(true);
        } else if (pkg.actionType === 'link' && pkg.link) {
            window.open(pkg.link, '_blank');
        }
    };
    
    return (
        <>
            <section id="human-packages" className="w-full py-20 md:py-32 bg-secondary/50 dark:bg-card/50">
                <div className="container px-4 md:px-6 space-y-20">
                    
                    {/* Main Intro */}
                    <div className="text-center max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Cuando necesitas refuerzo humano, aquí estamos.</h2>
                        <p className="mt-4 text-muted-foreground md:text-lg/relaxed">
                           Valeria te resuelve la mayoría de pasos. Si tu caso es más complejo o prefieres acompañamiento humano, puedes sumar a nuestros expertos con estos packs. Son soluciones guiadas por personas que conocen el terreno. Coordinamos contigo y con Valeria para ejecutar trámites, revisar documentos y evitar errores costosos.
                        </p>
                        <p className="mt-4 text-sm font-semibold text-primary/90 md:text-base">
                            Compatible con Valeria IA · Menos errores · Más rapidez
                        </p>
                    </div>

                    {/* Packs Section */}
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {packs.map((pkg) => (
                                <Card 
                                    key={pkg.id} 
                                    className="flex flex-col overflow-hidden shadow-lg border-transparent hover:border-primary transition-all duration-300 transform hover:-translate-y-2 group"
                                >
                                    <CardHeader className="items-center text-center pb-2">
                                        <div className="p-4 bg-primary/10 rounded-full inline-flex mb-2">
                                            <pkg.icon className="w-8 h-8 text-primary" />
                                        </div>
                                        <CardTitle className="font-headline text-2xl">{pkg.title}</CardTitle>
                                        <CardDescription className="font-semibold text-lg !mt-2">{pkg.price}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-3 pt-2 px-4">
                                        {pkg.features.map((feature, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 mt-1 text-green-500 flex-shrink-0"/>
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                    <CardFooter className="flex-col gap-2 p-4 mt-auto">
                                        <Button onClick={() => handleAction(pkg)} className="w-full">{pkg.cta}</Button>
                                        <p className="text-xs text-muted-foreground">{pkg.microcopy}</p>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                    
                    {/* How We Work Section */}
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                         <div className="space-y-4">
                             <h3 className="text-2xl font-bold font-headline">¿Cómo trabajamos?</h3>
                            <ul className="space-y-3 text-muted-foreground md:text-base/relaxed">
                                {howItWorksSteps.map((step, i) => (
                                     <li key={i} className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{i + 1}</div>
                                        <span className="text-foreground">{step.text}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm text-muted-foreground !mt-4"><strong>Nota:</strong> Valeria sigue contigo 24/7 para dudas y recordatorios.</p>
                         </div>
                         <Card className="bg-background">
                            <CardHeader>
                                <CardTitle>¿Valeria o Pack?</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                     <h4 className="font-semibold flex items-center gap-2 text-foreground"><Bot className="w-5 h-5 text-primary"/> Elige solo Valeria si...</h4>
                                     <p className="text-sm text-muted-foreground pl-7">...necesitas claridad, plantillas, tu caso es estándar y prefieres autogestión económica.</p>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                     <h4 className="font-semibold flex items-center gap-2 text-foreground"><Users className="w-5 h-5 text-primary"/> Elige Pack + Valeria si...</h4>
                                     <p className="text-sm text-muted-foreground pl-7">...tu caso tiene excepciones, plazos apretados, o prefieres que un humano lo lleve contigo.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                     {/* Final CTA Section */}
                    <div className="text-center max-w-3xl mx-auto">
                        <h3 className="text-2xl font-bold font-headline">Empieza con Valeria por 4,97€/mes o asegura resultados con un pack humano cuando lo necesites.</h3>
                        <div className="flex flex-wrap gap-4 justify-center mt-6">
                            <Button onClick={openChat}>Usar Valeria ahora</Button>
                             <Button asChild variant="outline">
                                <a href="https://www.viajamor.com/viaje/asesoria-viajes-90-minutos/" target="_blank" rel="noopener noreferrer">
                                    Reservar Consultoría (39€)
                                </a>
                            </Button>
                            <Button variant="outline" onClick={() => { setSelectedPackage("Onboarding en España"); setIsSheetOpen(true); }}>Pedir Onboarding</Button>
                            <Button variant="outline" onClick={() => { setSelectedPackage("Viaje Completo"); setIsSheetOpen(true); }}>Solicitar Viaje Completo</Button>
                        </div>
                    </div>
                    
                    <div className="text-center max-w-3xl mx-auto pt-8">
                         <p className="text-xs text-muted-foreground">Los packs incluyen acompañamiento informativo y operativo. No constituyen asesoramiento jurídico colegiado. Para dictámenes legales, podemos derivarte a profesionales colegiados.</p>
                    </div>

                </div>
            </section>
            
            <RequestQuoteSheet 
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                packageName={selectedPackage}
            />
        </>
    );
}
