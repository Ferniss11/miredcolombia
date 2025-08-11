
'use client';

import { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import JobCard from '@/components/jobs/JobCard';
import type { JobPosting } from '@/lib/types';

interface JobsListProps {
    initialJobs: JobPosting[];
}

export default function JobsList({ initialJobs }: JobsListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredJobs = useMemo(() => {
        if (!searchQuery) {
            return initialJobs;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return initialJobs.filter(job =>
            job.title.toLowerCase().includes(lowercasedQuery) ||
            job.companyName.toLowerCase().includes(lowercasedQuery) ||
            job.location.toLowerCase().includes(lowercasedQuery) ||
            job.requiredSkills?.some(skill => skill.toLowerCase().includes(lowercasedQuery))
        );
    }, [searchQuery, initialJobs]);

    return (
        <>
            <div className="max-w-2xl mx-auto mb-12">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por puesto, empresa o habilidad..."
                        className="w-full pl-10 py-3 text-base"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredJobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <h2 className="text-2xl font-semibold">No se encontraron ofertas</h2>
                    <p>Prueba con otros términos de búsqueda o vuelve más tarde.</p>
                </div>
            )}
        </>
    );
}
