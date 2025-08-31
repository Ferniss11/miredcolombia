
'use client';

import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Briefcase, Plane } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PackagesSection() {
    const packages = [
        {
            icon: MessageSquare,
            title: "Consultoría Inicial",
            price: "desde 39€",
            description: "Resuelve tus dudas con un experto y empieza con seguridad.",
            link: "/packs#consultoria",
            color: "bg-[#003893]" // Colombia Blue
        },
        {
            icon: Briefcase,
            title: "Onboarding en España",
            price: "A tu medida",
            description: "Te recibimos, te guiamos en tus primeros trámites y te acompañamos en la adaptación.",
            link: "/packs#onboarding",
            color: "bg-[#FFCD00]" // Colombia Yellow
        },
        {
            icon: Plane,
            title: "Viaje Completo",
            price: "Personalizado",
            description: "Organizamos tu viaje a España con seguridad: vuelos, seguros y traslados.",
            link: "/packs#viaje",
            color: "bg-[#C70039]" // Colombia Red
        }
    ];

    return (
        <section id="packages-home" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-card">
            <div className="container px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Nuestros Packs de Servicios</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                        Soluciones completas ofrecidas por nuestros partners expertos para garantizar una transición sin contratiempos.
                    </p>
                </div>
                <div className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
                    {packages.map((pkg) => (
                        <Card key={pkg.title} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                             <div className={cn("h-2 w-full", pkg.color)}></div>
                            <CardHeader className="text-center pt-8">
                                <div className="mx-auto p-4 bg-primary/10 rounded-full inline-flex mb-4">
                                     <pkg.icon className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="font-headline text-2xl">{pkg.title}</CardTitle>
                                <CardDescription className="font-semibold text-lg">{pkg.price}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center flex-grow">
                                <p className="text-muted-foreground">{pkg.description}</p>
                            </CardContent>
                             <CardFooter className="p-6 bg-secondary/30 dark:bg-card/50">
                                <Button asChild variant="default" className="w-full">
                                    <Link href={pkg.link}>
                                        Saber más <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
