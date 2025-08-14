// src/app/inmobiliaria/page.tsx
import { getPublicPropertiesAction } from "@/lib/real-estate/infrastructure/nextjs/property.server-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import PropertyListings from "@/components/inmobiliaria/PropertyListings";

export default async function InmobiliariaPage() {
  const { properties, error } = await getPublicPropertiesAction();

  return (
    <div className="min-h-screen">
        <div className="text-center py-8 bg-secondary dark:bg-card">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">Portal Inmobiliario</h1>
            <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
                Encuentra tu próximo hogar en España.
            </p>
        </div>

        {error && (
            <div className="container mx-auto py-4">
                <Alert variant="destructive" className="max-w-4xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al Cargar Propiedades</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )}

        <PropertyListings initialProperties={properties || []} />
    </div>
  );
}
