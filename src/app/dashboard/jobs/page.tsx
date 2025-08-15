// src/app/dashboard/jobs/page.tsx
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, MoreVertical, Briefcase, Eye, Users } from 'lucide-react';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { JobPostingFormSchema, JobPostingFormValues } from '@/lib/types';
import { JobPosting } from '@/lib/job-posting/domain/job-posting.entity';
import { createJobPostingAction, getJobPostingsAction, deleteJobPostingAction, updateJobPostingAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import JobForm from '@/components/jobs/JobForm';

const JobsPage = () => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user, userProfile } = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(JobPostingFormSchema),
  });

  const fetchJobPostings = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const result = await getJobPostingsAction();
      if (result.success) {
        setJobPostings(result.data || []);
      } else {
        console.error("Error fetching job postings:", result.error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar ofertas',
          description: result.error || 'No se pudieron cargar las ofertas de empleo.',
        });
      }
    } finally {
      setIsLoadingJobs(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJobPostings();
  }, [fetchJobPostings]);

  const handleOpenSheetForEdit = (job: JobPosting) => {
    setEditingJob(job);
    setIsSheetOpen(true);
  };
  
  const handleOpenSheetForCreate = () => {
    setEditingJob(null);
    form.reset();
    setIsSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setEditingJob(null);
    }
  };

  const onSubmit = async (values: JobPostingFormValues) => {
    startTransition(async () => {
      try {
        const imageInput = document.querySelector<HTMLInputElement>('input[name="imageFile"]');
        const imageFile = imageInput?.files?.[0];

        const companyLogoInput = document.querySelector<HTMLInputElement>('input[name="companyLogoFile"]');
        const companyLogoFile = companyLogoInput?.files?.[0];

        let result;
        if (editingJob) {
          result = await updateJobPostingAction(editingJob.id, values, imageFile, companyLogoFile);
        } else {
          if (!user || !userProfile) throw new Error("Authentication error");
          const creatorRole = userProfile.role.toLowerCase() as 'admin' | 'advertiser';
          const createData = { ...values, creatorId: user.uid, creatorRole };
          result = await createJobPostingAction(createData, imageFile, companyLogoFile);
        }

        if (result.success) {
          toast({
            title: `Oferta ${editingJob ? 'Actualizada' : 'Creada'}`,
            description: `La oferta de empleo ha sido ${editingJob ? 'actualizada' : 'creada'} exitosamente.`,
          });
          setIsSheetOpen(false);
          await fetchJobPostings();
        } else {
          throw new Error(result.error || 'Hubo un problema.');
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: `Error al ${editingJob ? 'Actualizar' : 'Crear'} Oferta`, description: error.message });
      }
    });
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta oferta de empleo?')) return;
    startTransition(async () => {
      const result = await deleteJobPostingAction(jobId);
      if (result.success) {
        toast({ title: 'Oferta Eliminada', description: 'La oferta ha sido eliminada.' });
        await fetchJobPostings();
      } else {
        toast({ variant: 'destructive', title: 'Error al Eliminar', description: result.error });
      }
    });
  };
  
  const getStatusBadgeClass = (status: JobPosting['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-300';
      case 'INACTIVE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PENDING_REVIEW': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'FILLED': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 relative">
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">Gestión de Ofertas de Empleo</h1>
          <Button className="hidden md:flex" onClick={handleOpenSheetForCreate}>
            <Plus className="mr-2 h-4 w-4" /> Crear Nueva Oferta
          </Button>
        </div>
        
        {isLoadingJobs ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : jobPostings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Briefcase className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No hay ofertas de empleo</h3>
            <p className="mt-1 text-sm">Crea la primera oferta para que aparezca aquí.</p>
            <Button className="mt-4" onClick={handleOpenSheetForCreate}>
              <Plus className="mr-2 h-4 w-4" /> Crear Oferta
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {jobPostings.map((job) => (
              <Card key={job.id} className="flex flex-col overflow-hidden">
                {job.imageUrl && <div className="relative h-32 w-full"><Image src={job.imageUrl} alt={job.title} layout="fill" objectFit="cover" /></div>}
                <CardHeader className="p-4 flex flex-row items-start gap-4">
                  {job.companyLogoUrl && <Image src={job.companyLogoUrl} alt={job.companyName} width={48} height={48} className="rounded-md object-contain border bg-white" />}
                  <div className="flex-grow">
                    <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.companyName}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link href={`/dashboard/jobs/${job.id}/applicants`}><Users className="mr-2 h-4 w-4" /> Ver Postulantes</Link></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenSheetForEdit(job)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href={`/empleos/previsualizar/${job.id}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> Previsualizar</Link></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(job.id)} disabled={isPending} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground flex-grow">{job.location} ({job.locationType})</CardContent>
                <CardFooter className="p-4 pt-0 border-t mt-auto"><Badge className={cn('mt-4', getStatusBadgeClass(job.status))}>{job.status}</Badge></CardFooter>
              </Card>
            ))}
          </div>
        )}

        <Button className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg" size="icon" onClick={handleOpenSheetForCreate}><Plus className="h-6 w-6" /></Button>
      
        <SheetContent className="sm:max-w-2xl w-full">
          <SheetHeader>
            <SheetTitle>{editingJob ? 'Editar Oferta de Empleo' : 'Crear Nueva Oferta de Empleo'}</SheetTitle>
            <SheetDescription>{editingJob ? 'Modifica los detalles de la vacante.' : 'Completa los detalles para publicar una nueva vacante.'}</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-150px)] pr-6">
            <div className="py-4">
              <JobForm form={form} isPending={isPending} onSubmit={onSubmit} jobToEdit={editingJob} />
            </div>
          </ScrollArea>
          <SheetFooter>
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingJob ? 'Guardar Cambios' : 'Crear Oferta')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default JobsPage;
