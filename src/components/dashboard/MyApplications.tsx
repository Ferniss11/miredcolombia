// src/components/dashboard/MyApplications.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Building, Clock, ArrowRight } from 'lucide-react';
import type { JobApplication } from '@/lib/job-application/domain/job-application.entity';
import { getApplicationsForUserAction } from '@/lib/job-application/infrastructure/nextjs/job-application.server-actions';
import Link from 'next/link';

export default function MyApplications() {
    const { user, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user) {
            getApplicationsForUserAction(user.uid).then(({ data, error }) => {
                if (error) {
                    console.error("Failed to fetch applications:", error);
                } else if (data) {
                    setApplications(data);
                }
                setIsLoading(false);
            });
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading]);

    if (applications.length === 0 && !isLoading) {
        return null; // Don't show the card if there are no applications
    }
    
    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    const getStatusBadge = (status: JobApplication['status']) => {
        switch(status) {
            case 'received': return <Badge variant="secondary">Recibida</Badge>;
            case 'in_review': return <Badge>En Revisión</Badge>;
            case 'contacted': return <Badge className="bg-blue-500 text-white">Contactado</Badge>;
            case 'rejected': return <Badge variant="destructive">Rechazada</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mis Postulaciones</CardTitle>
                <CardDescription>Aquí puedes ver el estado de las ofertas de empleo a las que has aplicado.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Puesto</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 2 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={4}><Skeleton className="h-5 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{app.jobTitle}</span>
                                                <span className="text-xs text-muted-foreground">{app.profileSnapshot?.companyName || 'Empresa Confidencial'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(app.applicationDate)}</TableCell>
                                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="ghost" size="sm">
                                                <Link href={`/empleos/${app.jobId}`}>
                                                    Ver Oferta <ArrowRight className="ml-2 h-4 w-4"/>
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
