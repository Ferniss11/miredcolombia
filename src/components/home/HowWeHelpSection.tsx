
import { Briefcase, Building, Package, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";
import { Badge } from "../ui/badge";

const features = [
    {
        icon: Briefcase,
        title: "Portal de Empleo",
        description: "Accede a vacantes reales y actualizadas en toda España. Valeria te ayuda a adaptar tu CV y prepararte para la entrevista.",
        link: "/empleos",
        cta: "Ver empleo"
    },
    {
        icon: Building,
        title: "Portal Inmobiliario",
        description: "Vivienda verificada: pisos, habitaciones y propietarios confiables. Valeria te da los mensajes exactos para presentar tu perfil y evitar estafas.",
        link: "/vivienda",
        cta: "Ver vivienda"
    },
    {
        icon: MapPin,
        title: "Directorio de Negocios",
        description: "Conecta con tiendas y servicios de compatriotas en tu ciudad. Valeria te recomienda los más relevantes según tu barrio.",
        link: "/directorio",
        cta: "Ver directorio"
    },
    {
        icon: Package,
        title: "Servicios de Llegada",
        description: "Desde recogida en aeropuerto hasta trámites. Combina Valeria + packs humanos para aterrizar sin contratiempos.",
        link: "/packs",
        cta: "Ver servicios"
    }
];

export default function HowWeHelpSection() {
    return (
        <section className="w-full py-8 bg-background">
            <div className="container px-4 md:px-6 max-w-6xl">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Tu Ecosistema Digital para Empezar en España</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                        Todo en un solo lugar. Empleo, vivienda, servicios y comunidad para que tu llegada sea un éxito.
                    </p>
                </div>
                <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature) => (
                        <Link key={feature.title} href={feature.link} className="group">
                             <Card className="h-full overflow-hidden shadow-lg hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
                                <CardHeader className="items-center text-center">
                                    <div className="p-4 bg-primary/10 rounded-full inline-flex group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                        <feature.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                                    </div>
                                    <CardTitle className="pt-4 font-headline">{feature.title}</CardTitle>
                                     <Badge variant="outline" className="mt-2 border-primary/50 text-primary">
                                        <Sparkles className="w-3 h-3 mr-1.5"/>
                                        Funciona con Valeria
                                     </Badge>
                                </CardHeader>
                                <CardContent className="text-center flex-grow">
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </CardContent>
                                <div className="text-center p-4 mt-auto">
                                    <span className="text-sm font-semibold text-primary group-hover:underline">
                                        {feature.cta} &rarr;
                                    </span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
