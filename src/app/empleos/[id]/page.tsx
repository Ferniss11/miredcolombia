

import React from 'react';
import type { Metadata } from 'next';
import { getPublicJobPostingByIdAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import { notFound } from 'next/navigation';
import { 
    Briefcase, 
    MapPin, 
    Clock, 
    DollarSign, 
    Building, 
    CheckSquare, 
    Calendar,
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ApplyButton from './ApplyButton';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: job } = await getPublicJobPostingByIdAction(params.id);

  if (!job) {
    return {
      title: "Oferta no encontrada",
    }
  }

  const title = `${job.title} en ${job.companyName} | Mi Red Colombia`;
  const description = job.description.substring(0, 155).trim() + '...';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: job.imageUrl || 'https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FLOGO.png?alt=media&token=86f8e9f6-587a-4cb6-bae1-15b0c815f22b',
          width: 1200,
          height: 630,
          alt: job.title,
        },
      ],
    },
  }
}

const JobDetailsPage = async ({ params }: { params: { id: string } }) => {
    const { data: job, error } = await getPublicJobPostingByIdAction(params.id);

    if (error || !job) {
        notFound();
    }
    
    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return 'No especificado';
        if (min && max) return `€${min.toLocaleString()} - €${max.toLocaleString()}`;
        if (min) return `Desde €${min.toLocaleString()}`;
        if (max) return `Hasta €${max.toLocaleString()}`;
        return 'No especificado';
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-950 py-12 md:py-16">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header Section */}
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row items-start gap-4">
                                {job.companyLogoUrl && (
                                    <Image
                                        src={job.companyLogoUrl}
                                        alt={`Logo de ${job.companyName}`}
                                        width={80}
                                        height={80}
                                        className="rounded-lg border bg-white object-contain flex-shrink-0"
                                    />
                                )}
                                <div className="flex-grow">
                                    <h1 className="text-3xl font-bold font-headline">{job.title}</h1>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <Building className="h-4 w-4" />
                                            <span>{job.companyName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4" />
                                            <span>{job.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            {job.imageUrl && (
                                <CardContent>
                                    <Image
                                        src={job.imageUrl}
                                        alt={`Imagen de la oferta ${job.title}`}
                                        width={1200}
                                        height={400}
                                        className="w-full h-auto max-h-[400px] object-cover rounded-lg"
                                    />
                                </CardContent>
                            )}
                        </Card>

                        {/* Description Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Descripción del Puesto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className="prose dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br />') }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="sticky top-24 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl">Resumen de la Oferta</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Salario</p>
                                        <p className="font-semibold">{formatSalary(job.salaryRange?.min, job.salaryRange?.max)}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-center gap-3">
                                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Tipo de Contrato</p>
                                        <p className="font-semibold">{job.jobType.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Modalidad</p>
                                        <p className="font-semibold">{job.locationType.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                {job.applicationDeadline && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-muted-foreground">Fecha Límite</p>
                                                <p className="font-semibold">{new Date(job.applicationDeadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="pt-4 flex flex-col gap-2">
                                   <ApplyButton jobId={job.id} jobTitle={job.title} />
                                </div>
                            </CardContent>
                        </Card>
                        
                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <CheckSquare className="h-5 w-5" />
                                        Habilidades Requeridas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {job.requiredSkills.map(skill => (
                                            <Badge key={skill} variant="secondary">{skill}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default JobDetailsPage;
