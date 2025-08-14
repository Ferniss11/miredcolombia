
import { Button } from "@/components/ui/button";
import type { Metadata } from 'next'
import { getPublishedServiceListingsAction } from "@/lib/service-listing/infrastructure/nextjs/service-listing.server-actions";
import Link from "next/link";
import ServiceList from "@/components/services/ServiceList";
 
export const metadata: Metadata = {
  title: 'Servicios Profesionales | Mi Red Colombia',
  description: 'Encuentra servicios ofrecidos por la comunidad colombiana en España. Desde clases particulares hasta desarrollo web.',
}

export default async function ServicesPage() {
    const { listings, error } = await getPublishedServiceListingsAction();

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">Portal de Servicios</h1>
                <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
                    Conecta con profesionales y autónomos de la comunidad colombiana en España.
                </p>
                 <Button className="mt-4" asChild>
                    <Link href="/dashboard/my-services">Publica tu Servicio</Link>
                </Button>
            </div>

            <ServiceList initialListings={listings || []} />
        </div>
    );
}
