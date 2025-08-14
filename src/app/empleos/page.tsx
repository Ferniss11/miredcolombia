// src/app/empleos/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import { getPublicJobPostingsAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Upload, Building, PlusCircle } from 'lucide-react';
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
                    <Link href="/dashboard/jobs">
                        <PlusCircle className="mr-2 h-4 w-4" /> Publica tu oferta
                    </Link>
                </Button>
            );
        }
        return (
            <Button onClick={() => setIsSheetOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Publica tu oferta
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
                    <div className="mt-6">{renderCtaButton()}</div>
                </div>

                {error && (
                    <Alert variant="destructive" className="max-w-4xl mx-auto">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error al Cargar Ofertas</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <JobsList initialJobs={jobs || []} />
            </div>
            <GuestJobCreationSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
        </>
    );
};

export default JobsPublicPage;
