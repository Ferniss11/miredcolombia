
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Building, Upload } from "lucide-react";
import Link from "next/link";
import { JobPosting } from '@/lib/types';
import JobCard from '@/components/jobs/JobCard';
import { Card, CardContent } from '../ui/card';
import { useAuth } from '@/context/AuthContext';

interface JobsCtaSectionProps {
    jobs: JobPosting[];
}

const JobsCtaSection: React.FC<JobsCtaSectionProps> = ({ jobs }) => {
    
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">Portal de Empleo</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Oportunidades de Empleo y Trabajo</h2>
                        <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 font-body">
                            Explora las vacantes más recientes para profesionales colombianos en España y da el siguiente paso en tu carrera.
                        </p>
                    </div>
                </div>

                {jobs && jobs.length > 0 ? (
                    <>
                        <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-12">
                            {jobs.map((job) => (
                                <JobCard key={job.id} job={job} />
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <Button asChild>
                                <Link href="/jobs">
                                    Ver Todas las Ofertas <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </>
                ) : (
                    // This part remains empty as the CTA cards are now on the main /jobs page.
                    // We can add a simple message here if needed in the future.
                    <div className="text-center py-12">
                         <Button asChild>
                            <Link href="/jobs">
                                Explorar Portal de Empleo <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default JobsCtaSection;
