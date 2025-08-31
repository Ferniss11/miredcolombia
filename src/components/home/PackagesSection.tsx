
'use client';

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Briefcase, Plane } from "lucide-react";
import Link from "next/link";
import { migrationPackages } from "@/lib/placeholder-data";

export default function PackagesSection() {
    const packages = [
        {
            icon: MessageSquare,
            title: "Consultoría Inicial",
            price: "desde 39€",
            description: "Resuelve tus dudas con un experto y empieza con seguridad.",
            link: "/packs#consultoria"
        },
        {
            icon: Briefcase,
            title: "Onboarding en España",
            price: "A tu medida",
            description: "Te recibimos, te guiamos en tus primeros trámites y te acompañamos en la adaptación.",
            link: "/packs#onboarding"
        },
        {
            icon: Plane,
            title: "Viaje Completo",
            price: "Personalizado",
            description: "Organizamos tu viaje a España con seguridad: vuelos, seguros y traslados.",
            link: "/packs#viaje"
        }
    ];

    return (
        <section id="packages-home" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
            <div className="container px-4 md:px-6">
                <div className="mx-auto grid max-w-6xl items-center gap-8">
                    {packages.map((pkg) => (
                        <Card key={pkg.title} className="shadow-none border-none bg-transparent">
                            <CardHeader className="flex flex-row items-center gap-4 p-0">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <pkg.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl font-headline">{pkg.title}</h3>
                                    <p className="text-muted-foreground">{pkg.price}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 pt-4">
                                <p className="text-muted-foreground">{pkg.description}</p>
                                <Button asChild variant="link" className="p-0 h-auto mt-2 text-primary font-semibold">
                                    <Link href={pkg.link}>Saber más <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
