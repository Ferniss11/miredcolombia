
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Map } from "lucide-react";
import Link from "next/link";
import { JobPosting } from '@/lib/types';
import JobCard from '@/components/jobs/JobCard';

interface JobsSectionProps {
    jobs: JobPosting[];
}

const JobsSection: React.FC<JobsSectionProps> = ({ jobs }) => {
    if (!jobs || jobs.length === 0) {
        return null; // Don't render if there are no jobs
    }

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">Oportunidades Laborales</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Últimas Ofertas de Empleo</h2>
                        <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300 font-body">
                            Explora las oportunidades más recientes para profesionales colombianos en España.
                        </p>
                    </div>
                </div>

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
            </div>
        </section>
    );
};

export default JobsSection;
