

import { Star, MessageCircleQuote } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Valentina Rojas",
    location: "desde Valencia",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop&q=80",
    rating: 5,
    text: "¡El servicio fue increíble! Me ayudaron con cada paso del proceso de mi visa de estudiante. Resolvieron todas mis dudas con mucha paciencia y profesionalismo. ¡Totalmente recomendados!",
  },
  {
    name: "Santiago Bernal",
    location: "desde Madrid",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&q=80",
    rating: 5,
    text: "No sabía por dónde empezar con la homologación de mi título. El equipo de Colombia en España me guió perfectamente y gracias a ellos pude empezar a trabajar mucho antes de lo que esperaba.",
  },
  {
    name: "Isabella Cruz",
    location: "desde Barcelona",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80",
    rating: 5,
    text: "Contraté el paquete de búsqueda de vivienda y fue la mejor decisión. Encontraron un piso perfecto para mi familia en una zona genial. Me ahorraron muchísimo estrés y tiempo.",
  },
  {
    name: "Mateo Giraldo",
    location: "desde Sevilla",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80",
    rating: 5,
    text: "Como emprendedor, necesitaba asesoría para montar mi negocio. Su conocimiento del sistema español y su apoyo fueron fundamentales para lanzar mi cafetería. ¡Mil gracias por todo!",
  },
];

export default function TestimonialsSection() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">Lo que dicen de nosotros</div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Historias de Nuevos Comienzos</h2>
                    <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 font-body">
                        Descubre cómo hemos ayudado a otros colombianos a cumplir su sueño de vivir en España.
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
