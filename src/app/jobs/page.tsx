
import React from 'react';
import type { Metadata } from 'next';
import { getPublicJobPostingsAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';

export const metadata: Metadata = {
    title: 'Portal de Empleo | Mi Red Colombia',
    description: 'Encuentra tu próxima oportunidad profesional en España. Explora las últimas ofertas de empleo para colombianos.',
    openGraph: {
        title: 'Portal de Empleo | Mi Red Colombia',
        description: 'Encuentra tu próxima oportunidad profesional en España.',
        url: 'https://www.miredcolombia.com/jobs',
        images: [
            {
                url: 'https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b',
                width: 512,
                height: 512,
                alt: 'Mi Red Colombia Logo',
            },
        ],
    },
};

const JobsPublicPage = async () => {
    const { data: jobs, error } = await getPublicJobPostingsAction();

    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">Portal de Empleo</h1>
                <p className="text-lg text-muted-foreground mt-2 font-body max-w-2xl mx-auto">
                    Encuentra tu próxima oportunidad profesional en España.
                </p>
            </div>

            <div className="max-w-2xl mx-auto mb-12">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por puesto, empresa o habilidad..."
                        className="w-full pl-10 py-3 text-base"
                    />
                </div>
                {/* Filter section will go here in a future phase */}
            </div>

            {error && (
                <Alert variant="destructive" className="max-w-4xl mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error al Cargar Ofertas</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!error && jobs && jobs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>
            ) : !error && (
                <div className="text-center py-16 text-muted-foreground">
                    <h2 className="text-2xl font-semibold">No hay ofertas disponibles</h2>
                    <p>Actualmente no hay ofertas de empleo publicadas. ¡Vuelve pronto!</p>
                </div>
            )}
        </div>
    );
};

export default JobsPublicPage;
