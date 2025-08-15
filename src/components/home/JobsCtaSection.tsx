

'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Building, Handshake } from "lucide-react";
import Link from "next/link";
import { JobsCtaSectionProps } from '@/lib/types';
import JobCard from '@/components/jobs/JobCard';
import { Card, CardContent } from '../ui/card';
import { useAuth } from '@/context/AuthContext';
import GuestJobCreationSheet from '../jobs/GuestJobCreationSheet';
import GuestServiceCreationSheet from '../services/GuestServiceCreationSheet';

const JobsCtaSection: React.FC<JobsCtaSectionProps> = ({ jobs }) => {
    const { user } = useAuth();
    const [isJobSheetOpen, setJobSheetOpen] = useState(false);
    const [isServiceSheetOpen, setServiceSheetOpen] = useState(false);

    return (
        <>
            <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">Portal de Empleo</div>
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Oportunidades de Empleo y Trabajo</h2>
                            <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
                                Explora las vacantes más recientes para profesionales colombianos en España y da el siguiente paso en tu carrera.
                            </p>
                        </div>
                    </div>

                    {/* Job Postings List */}
                    <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-12">
                        {jobs && jobs.length > 0 ? (
                            jobs.map((job) => (
                                <JobCard key={job.id} job={job} />
                            ))
                        ) : (
                            <p className="col-span-full text-center text-muted-foreground">Actualmente no hay ofertas de empleo. ¡Vuelve pronto!</p>
                        )}
                    </div>

                    {/* Call to Action Section */}
                    <div className="py-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <Card className="relative overflow-hidden bg-background shadow-lg text-center">
                            <div className="absolute inset-0 bg-conic-glow opacity-20"></div>
                            <CardContent className="p-8 flex flex-col items-center justify-center h-full relative">
                                <div className="mx-auto p-4 bg-primary/20 rounded-full inline-flex mb-4">
                                    <Briefcase className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold font-headline">¿Tienes una vacante?</h3>
                                <p className="text-muted-foreground mt-2 mb-6 flex-grow">
                                    Publica tu oferta de empleo y llega a miles de profesionales colombianos cualificados en España.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                    <Button onClick={() => user ? window.location.href='/dashboard/jobs' : setJobSheetOpen(true)} className="flex-1">
                                        Publica tu oferta
                                    </Button>
                                    <Button asChild variant="secondary" className="flex-1">
                                        <Link href="/empleos">Ver empleos</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="relative overflow-hidden bg-background shadow-lg text-center">
                            <div className="absolute inset-0 bg-conic-glow opacity-20"></div>
                            <CardContent className="p-8 flex flex-col items-center justify-center h-full relative">
                                <div className="mx-auto p-4 bg-accent/20 rounded-full inline-flex mb-4">
                                    <Handshake className="w-8 h-8 text-accent" />
                                </div>
                                <h3 className="text-xl font-bold font-headline">Ofrece tus Servicios Profesionales</h3>
                                <p className="text-muted-foreground mt-2 mb-6 flex-grow">
                                    ¿Eres un profesional autónomo? Publica tus servicios y encuentra clientes dentro de la comunidad.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                    <Button onClick={() => user ? window.location.href='/dashboard/my-services' : setServiceSheetOpen(true)} className="flex-1">
                                        Ofrecer mis servicios
                                    </Button>
                                    <Button asChild variant="secondary" className="flex-1">
                                        <Link href="/servicios">Ver servicios</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
            <GuestJobCreationSheet isOpen={isJobSheetOpen} onOpenChange={setJobSheetOpen} />
            <GuestServiceCreationSheet isOpen={isServiceSheetOpen} onOpenChange={setServiceSheetOpen} />
        </>
    );
};

export default JobsCtaSection;
