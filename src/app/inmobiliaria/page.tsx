
// src/app/inmobiliaria/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getPublicPropertiesAction } from "@/lib/real-estate/infrastructure/nextjs/property.server-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, PlusCircle } from "lucide-react";
import PropertyListings from "@/components/inmobiliaria/PropertyListings";
import { Button } from "@/components/ui/button";
import GuestPropertyCreationSheet from "@/components/inmobiliaria/GuestPropertyCreationSheet";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { Property } from '@/lib/real-estate/domain/property.entity';

// This is now a client component to handle interaction logic
export default function InmobiliariaPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    getPublicPropertiesAction().then(({ properties, error }) => {
      if (error) setError(error);
      if (properties) setProperties(properties);
    });
  }, []); // Empty dependency array ensures this runs only once on mount

  const renderCallToActionButton = () => {
    if (user) {
        return (
            <Button asChild>
                <Link href="/dashboard/my-properties">
                    <PlusCircle className="mr-2 h-4 w-4" /> Publicar Propiedad
                </Link>
            </Button>
        );
    }
    return (
        <Button onClick={() => setIsSheetOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Publicar Propiedad
        </Button>
    );
  }

  return (
    <div className="min-h-screen">
        <div className="text-center py-8 bg-secondary dark:bg-card">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">Portal Inmobiliario</h1>
            <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
                Encuentra tu próximo hogar en España.
            </p>
             <div className="mt-4">{renderCallToActionButton()}</div>
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
        
        <GuestPropertyCreationSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </div>
  );
}
