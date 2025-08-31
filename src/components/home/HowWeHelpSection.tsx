
import { Briefcase, Building, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";

const features = [
    {
        icon: Briefcase,
        title: "Empleo",
        description: "Encuentra vacantes reales en España abiertas a colombianos.",
        link: "/empleos"
    },
    {
        icon: Building,
        title: "Vivienda",
        description: "Opciones seguras y filtradas, sin estafas.",
        link: "/vivienda"
    },
    {
        icon: Package,
        title: "Servicios de Llegada",
        description: "Viaje, onboarding y consultoría con nuestros partners.",
        link: "/packs"
    }
];

export default function HowWeHelpSection() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">¿Cómo te ayudamos a empezar?</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                        Tres pilares fundamentales para que tu llegada y establecimiento en España sea un éxito.
                    </p>
                </div>
                <div className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
                    {features.map((feature) => (
                        <Link key={feature.title} href={feature.link} className="group">
                             <Card className="h-full overflow-hidden shadow-lg hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-2">
                                <CardHeader className="items-center text-center">
                                    <div className="p-4 bg-primary/10 rounded-full inline-flex group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                        <feature.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                                    </div>
                                    <CardTitle className="pt-4 font-headline">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
