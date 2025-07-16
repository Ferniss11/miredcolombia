
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Building, Map } from "lucide-react";
import Image from "next/image";
import type { PlaceDetails } from "@/lib/types";

type DirectorySectionProps = {
    businesses: PlaceDetails[];
};

export default function DirectorySection({ businesses }: DirectorySectionProps) {
    if (businesses.length === 0) {
        return null; // Don't render the section if there are no businesses
    }

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">Negocios de Confianza</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Descubre la Comunidad</h2>
                        <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 font-body">
                            Explora restaurantes, tiendas y servicios ofrecidos por colombianos en España. Apoya a nuestra gente.
                        </p>
                    </div>
                </div>

                <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
                    {businesses.map((business) => (
                         <Card key={business.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                             <CardHeader className="p-0">
                                <Image
                                    src={business.photoUrl || "https://placehold.co/400x250.png"}
                                    alt={business.displayName}
                                    width={400}
                                    height={250}
                                    data-ai-hint={`${business.category} storefront`}
                                    className="w-full h-48 object-cover"
                                />
                             </CardHeader>
                            <CardContent className="p-4 flex-grow">
                                <h3 className="text-lg font-bold font-headline line-clamp-2">{business.displayName}</h3>
                                <p className="text-sm text-muted-foreground flex items-center mt-1">
                                    <Building className="w-4 h-4 mr-2" />
                                    {business.category}
                                </p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 mt-auto">
                                <Button asChild variant="link" className="text-accent-foreground p-0 h-auto font-semibold">
                                <Link href={`/directory/${business.id}`}>
                                    Ver Perfil <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                
                <div className="flex justify-center">
                    <Button asChild>
                        <Link href="/directory">
                            Ver Directorio Completo <Map className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
