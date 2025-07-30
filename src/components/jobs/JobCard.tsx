
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import Image from 'next/image';
import { JobPosting } from '@/lib/types';
import { Briefcase, MapPin } from 'lucide-react';

interface JobCardProps {
    job: JobPosting;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full group">
            <Link href={`/jobs/${job.id}`} className="flex flex-col flex-grow">
                <CardHeader className="p-4">
                    <div className="flex items-start gap-4">
                        {job.companyLogoUrl ? (
                            <Image 
                                src={job.companyLogoUrl} 
                                alt={`Logo de ${job.companyName}`} 
                                width={48} 
                                height={48} 
                                className="rounded-md border object-contain bg-white" 
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-md border bg-muted flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-grow">
                            <p className="text-sm text-muted-foreground line-clamp-1">{job.companyName}</p>
                            <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2 transition-colors group-hover:text-primary">
                                {job.title}
                            </h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                           <MapPin className="h-4 w-4 flex-shrink-0" />
                           <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 flex-shrink-0" />
                            <span>{job.jobType.replace('_', ' ')}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 mt-auto">
                    <Badge variant="secondary">{job.locationType === 'ON_SITE' ? 'Presencial' : job.locationType}</Badge>
                </CardFooter>
            </Link>
        </Card>
    );
};

export default JobCard;
