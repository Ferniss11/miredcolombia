
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: 'Servicios Profesionales | Mi Red Colombia',
  description: 'Encuentra servicios ofrecidos por la comunidad colombiana en España. Desde clases particulares hasta desarrollo web.',
}

export default async function ServicesPage() {
    // En el futuro, aquí llamaremos a la acción para obtener los servicios.
    // const { services, error } = await getServiceListingsAction();
    const services: any[] = [];

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">Portal de Servicios</h1>
                <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
                    Conecta con profesionales y autónomos de la comunidad colombiana en España.
                </p>
                 <Button className="mt-4" asChild>
                    <a href="/dashboard">Publica tu Servicio</a>
                </Button>
            </div>

            <div className="max-w-2xl mx-auto mb-12">
                <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar por servicio o ciudad..."
                    className="w-full pl-10 py-3 text-base"
                />
                </div>
            </div>

            {services.length === 0 ? (
                 <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                    <h2 className="text-2xl font-semibold">Aún no hay servicios publicados</h2>
                    <p className="mt-1 text-sm">¡Sé el primero en ofrecer tus habilidades a la comunidad!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                   {/* Aquí se mapearán los ServiceCard cuando tengamos datos */}
                </div>
            )}
        </div>
    );
}
