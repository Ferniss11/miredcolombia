
import { Star } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Valentina Rojas",
    location: "desde Valencia",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop&q=80",
    rating: 5,
    text: "Valeria IA me dio un plan de 90 días con checklists y plantillas. En una semana tenía el CV formato España y mensajes listos para caseros. Evité una habitación patera gracias a sus alertas antiestafa.",
  },
  {
    name: "Santiago Bernal",
    location: "desde Madrid",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&q=80",
    rating: 5,
    text: "No sabía por dónde empezar con la homologación y empadronamiento. Valeria me guió paso a paso, avisándome de citas y plazos. Con su simulador de entrevista conseguí mi primer contrato.",
  },
  {
    name: "Isabella Cruz",
    location: "desde Barcelona",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80",
    rating: 5,
    text: "Contraté el Pack 3 meses y fue clave: rutas legales claras, documentos que piden las inmobiliarias y mensajes listos para enviar. Encontramos piso sin caer en estafas y ahorré muchísimo tiempo.",
  },
  {
    name: "Mateo Giraldo",
    location: "desde Sevilla",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80",
    rating: 5,
    text: "Como emprendedor, usé Valeria para trámites y licencias. Me preparó plantillas de correos y un checklist para no saltarme nada. La diferencia fue la disponibilidad 24/7 y respuestas en lenguaje simple.",
  },
];

export default function TestimonialsSection() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary dark:bg-card">
            <div className="container px-4 md:px-6 max-w-6xl">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Resultados reales con Valeria IA</h2>
                    <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 font-body">
                        Cómo la IA de MiRedColombia acelera empleo, vivienda y papeles.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                            <CardContent className="p-6 flex-grow flex flex-col items-center text-center">
                                <Image
                                    src={testimonial.avatar}
                                    alt={`Avatar de ${testimonial.name}`}
                                    width={80}
                                    height={80}
                                    data-ai-hint="person avatar"
                                    className="rounded-full mb-4 border-2 border-primary/50 object-cover"
                                />
                                <h3 className="font-bold font-headline text-lg">{testimonial.name}</h3>
                                <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                                <div className="flex items-center my-3">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-muted-foreground text-sm italic flex-grow">
                                    "{testimonial.text}"
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

TestimonialsSection.displayName = "TestimonialsSection";
