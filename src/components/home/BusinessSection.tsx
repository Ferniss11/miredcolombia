import { Button } from "@/components/ui/button";
import { Building, Users, TrendingUp, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function BusinessSection() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
            <div className="container px-4 md:px-6">
                <div className="bg-white dark:bg-card rounded-xl shadow-lg p-8 md:p-12">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-primary">
                                <Building className="h-6 w-6" />
                                <span className="font-semibold">Para Negocios</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold font-headline">¿Tienes un negocio en España?</h2>
                            <p className="text-muted-foreground text-lg">
                                Conecta con miles de colombianos que necesitan tus servicios. Promociona tu negocio en la plataforma líder de migración.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    <span className="font-medium">+10,000 usuarios</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    <span className="font-medium">95% satisfacción</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button asChild size="lg">
                                    <Link href="/signup?role=advertiser">
                                        Registrar mi negocio
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="outline">
                                    <Link href="/pricing">
                                        Ver planes y precios
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 shadow-inner">
                            <div className="flex flex-col items-center text-center">
                                <div className="p-4 bg-primary rounded-full mb-4">
                                    <Building className="h-8 w-8 text-primary-foreground" />
                                </div>
                                <h3 className="font-bold font-headline text-xl">Tu Negocio Aquí</h3>
                                <div className="flex gap-1 text-yellow-400 my-2">
                                    <Star className="h-5 w-5 fill-current" />
                                    <Star className="h-5 w-5 fill-current" />
                                    <Star className="h-5 w-5 fill-current" />
                                    <Star className="h-5 w-5 fill-current" />
                                    <Star className="h-5 w-5 fill-current" />
                                </div>
                                <p className="text-muted-foreground text-sm italic">"Excelente servicio para la comunidad colombiana"</p>
                                <div className="flex gap-4 mt-4 w-full">
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
