
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import type { Metadata } from 'next';
import { getPublishedServiceListingsAction } from "@/lib/service-listing/infrastructure/nextjs/service-listing.server-actions";
import Link from "next/link";
import ServiceList from "@/components/services/ServiceList";
import GuestServiceCreationSheet from '@/components/services/GuestServiceCreationSheet';
import { useAuth } from '@/context/AuthContext';
import type { ServiceListing } from '@/lib/types';

// export const metadata: Metadata = {
//   title: 'Servicios Profesionales | Mi Red Colombia',
//   description: 'Encuentra servicios ofrecidos por la comunidad colombiana en España. Desde clases particulares hasta desarrollo web.',
// }

export default function ServicesPage() {
    const { user } = useAuth();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [listings, setListings] = useState<ServiceListing[]>([]);
    
    // Fetch listings on the client side using useEffect to avoid render-cycle errors.
    useEffect(() => {
        getPublishedServiceListingsAction().then(({ listings, error }) => {
            if (error) {
                console.error("Failed to fetch service listings:", error);
            } else if (listings) {
                setListings(listings);
            }
        });
    }, []); // Empty dependency array ensures this runs only once on mount.


    const renderCallToActionButton = () => {
        if (user) {
            return (
                <Button className="mt-4" asChild>
                    <Link href="/dashboard/my-services">Publica tu Servicio</Link>
                </Button>
            );
        }
        return (
            <Button className="mt-4" onClick={() => setIsSheetOpen(true)}>
                Publica tu Servicio
            </Button>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">Portal de Servicios</h1>
                <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
                    Conecta con profesionales y autónomos de la comunidad colombiana en España.
                </p>
                {renderCallToActionButton()}
            </div>

            <ServiceList initialListings={listings || []} />

            <GuestServiceCreationSheet
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />
        </div>
    );
}
