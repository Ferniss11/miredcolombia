// src/app/empleos/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import { getPublicJobPostingsAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Upload, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import JobsList from '@/components/jobs/JobsList';
import { useAuth } from '@/context/AuthContext';
import GuestJobCreationSheet from '@/components/jobs/GuestJobCreationSheet';
import type { JobPosting } from '@/lib/types';

// export const metadata: Metadata = {
//     title: 'Oportunidades de Empleo y Trabajo | Mi Red Colombia',
//     description: 'Encuentra tu próxima oportunidad profesional en España. Explora las últimas ofertas de empleo para colombianos.',
//     openGraph: {
//         title: 'Oportunidades de Empleo y Trabajo | Mi Red Colombia',
//         description: 'Encuentra tu próxima oportunidad profesional en España.',
//         url: 'https://www.miredcolombia.com/empleos',
//         images: [
//             {
//                 url: 'https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b',
//                 width: 512,
//                 height: 512,
//                 alt: 'Mi Red Colombia Logo',
//             },
//         ],
//     },
// };

const JobsPublicPage = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    useEffect(() => {
        getPublicJobPostingsAction().then(({ data, error }) => {
            if (error) setError(error);
            if (data) setJobs(data);
        });
    }, []);

    const renderCtaButton = () => {
        if (user) {
            return (
                <Button asChild>
                    <Link href="/dashboard/jobs">Publica tu oferta ahora</Link>
                </Button>
            );
        }
        return (
            <Button onClick={() => setIsSheetOpen(true)}>
                Publica tu oferta ahora
            </Button>
        );
    };

    return (
        <>
            <div className="container mx-auto px-4 py-12 md:px-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Oportunidades de Empleo y Trabajo</h1>
                    <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
                        Encuentra tu próxima aventura profesional en España.
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive" className="max-w-4xl mx-auto">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error al Cargar Ofertas</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <JobsList initialJobs={jobs || []} />

                {/* CTA Section */}
                <div className="py-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Card className="relative overflow-hidden bg-background shadow-lg text-center">
                        <div className="absolute inset-0 bg-conic-glow opacity-20"></div>
                        <CardContent className="p-8 flex flex-col items-center justify-center h-full relative">
                            <div className="mx-auto p-4 bg-primary/20 rounded-full inline-flex mb-4">
                                <Building className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold font-headline">¿Tienes una vacante?</h3>
                            <p className="text-muted-foreground mt-2 mb-6 flex-grow">
                                Publica tu oferta de empleo y llega a miles de profesionales colombianos cualificados en España.
                            </p>
                            {renderCtaButton()}
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden bg-background shadow-lg text-center">
                        <div className="absolute inset-0 bg-conic-glow opacity-20"></div>
                        <CardContent className="p-8 flex flex-col items-center justify-center h-full relative">
                            <div className="mx-auto p-4 bg-secondary rounded-full inline-flex mb-4">
                                <Upload className="w-8 h-8 text-secondary-foreground" />
                            </div>
                            <h3 className="text-xl font-bold font-headline">¿Buscas tu próxima oportunidad?</h3>
                            <p className="text-muted-foreground mt-2 mb-6 flex-grow">
                                Crea tu perfil de candidato, sube tu CV y deja que las oportunidades te encuentren.
                            </p>
                            <Button asChild variant="secondary">
                                <Link href="/signup?role=user">
                                    Sube tu Hoja de Vida
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <GuestJobCreationSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
        </>
    );
};

export default JobsPublicPage;
