
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Eye, Briefcase } from 'lucide-react';
import type { JobApplication } from '@/lib/job-application/domain/job-application.entity';
import Link from 'next/link';

export default function JobApplicantsPage() {
    const { jobId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [applicants, setApplicants] = useState<JobApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchApplicants = useCallback(async () => {
        if (!user || typeof jobId !== 'string') return;
        setIsLoading(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/jobs/${jobId}/applicants`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to fetch applicants.');
            }
            const data: JobApplication[] = await response.json();
            setApplicants(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [jobId, user, toast]);

    useEffect(() => {
        if (!authLoading) {
            fetchApplicants();
        }
    }, [authLoading, fetchApplicants]);

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Ofertas
                    </Button>
                    <h1 className="text-3xl font-bold font-headline">Postulantes a la Oferta</h1>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Candidatos</CardTitle>
                    <CardDescription>Estos son los usuarios que han aplicado a tu oferta de empleo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidato</TableHead>
                                    <TableHead>Fecha de Postulación</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={4}><Skeleton className="h-5 w-full" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : applicants.length > 0 ? (
                                    applicants.map(app => (
                                        <TableRow key={app.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground"/>
                                                    <span>{app.profileSnapshot.professionalTitle || 'Sin título profesional'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDate(app.applicationDate)}</TableCell>
                                            <TableCell>{getStatusBadge(app.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <a href={app.profileSnapshot.resumeUrl} target="_blank" rel="noopener noreferrer">
                                                       <Eye className="mr-2 h-4 w-4"/> Ver Perfil / CV
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            Aún no hay postulantes para esta oferta.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
