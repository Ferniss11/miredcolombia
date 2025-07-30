
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, MoreVertical, Briefcase, Eye } from 'lucide-react';
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

const JobsPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user, userProfile, loading } = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(JobPostingFormSchema),
    defaultValues: {
      title: '',
      description: '',
      companyName: '',
      location: '',
      locationType: 'ON_SITE',
      salaryRangeMin: undefined,
      salaryRangeMax: undefined,
      jobType: 'FULL_TIME',
      applicationUrl: '',
      applicationEmail: '',
      applicationDeadline: '',
      requiredSkills: [],
      status: 'ACTIVE',
    },
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

  useEffect(() => {
    if (editingJob) {
      form.reset({
        ...editingJob,
        salaryRangeMin: editingJob.salaryRange?.min,
        salaryRangeMax: editingJob.salaryRange?.max,
        applicationDeadline: editingJob.applicationDeadline ? new Date(editingJob.applicationDeadline).toISOString().split('T')[0] : '',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        companyName: '',
        location: '',
        locationType: 'ON_SITE',
        salaryRangeMin: undefined,
        salaryRangeMax: undefined,
        jobType: 'FULL_TIME',
        applicationUrl: '',
        applicationEmail: '',
        applicationDeadline: '',
        requiredSkills: [],
        status: 'ACTIVE',
      });
    }
  }, [editingJob, form]);

  const handleOpenSheetForEdit = (job: JobPosting) => {
    setEditingJob(job);
    setIsSheetOpen(true);
  };
  
  const handleOpenSheetForCreate = () => {
    setEditingJob(null);
    form.reset(); // Explicitly reset form for creation
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
          // Update existing job
          result = await updateJobPostingAction(editingJob.id, values, imageFile, companyLogoFile);
        } else {
          // Create new job
          if (!user || !userProfile) {
            toast({ variant: 'destructive', title: 'Error de Autenticación', description: 'Debes iniciar sesión.' });
            return;
          }
          const creatorRole = userProfile.role.toLowerCase() as 'admin' | 'advertiser';
          const createData = { ...values, creatorId: user.uid, creatorRole };
          result = await createJobPostingAction(createData, imageFile, companyLogoFile);
        }

        if (result.success) {
          toast({
            title: `Oferta ${editingJob ? 'Actualizada' : 'Creada'}`,
            description: `La oferta de empleo ha sido ${editingJob ? 'actualizada' : 'creada'} exitosamente.`,
          });
          form.reset();
          setIsSheetOpen(false);
          await fetchJobPostings();
        } else {
          toast({
            variant: 'destructive',
            title: `Error al ${editingJob ? 'Actualizar' : 'Crear'} Oferta`,
            description: result.error || 'Hubo un problema.',
          });
        }
      } catch (error: any) {
        console.error('Error handling job submission:', error);
        toast({ variant: 'destructive', title: 'Error Inesperado', description: error.message });
      }
    });
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta oferta de empleo?')) {
      return;
    }
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
      case 'FILLED': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const JobForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título del Puesto</FormLabel><FormControl><Input placeholder="Ej: Desarrollador Frontend Senior" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
         <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción del Puesto</FormLabel><FormControl><Textarea placeholder="Describe las responsabilidades, requisitos y beneficios..." className="min-h-[150px]" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
         <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Nombre de la Empresa</FormLabel><FormControl><Input placeholder="Ej: Mi Empresa S.L." {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
        <FormItem><FormLabel>Logo de la Empresa (Opcional)</FormLabel><FormControl><Input type="file" accept="image/*" name="companyLogoFile" disabled={isPending} /></FormControl><FormDescription>Sube un nuevo logo para reemplazar el actual si es necesario.</FormDescription></FormItem>
        <FormItem><FormLabel>Imagen de la Oferta (Opcional)</FormLabel><FormControl><Input type="file" accept="image/*" name="imageFile" disabled={isPending} /></FormControl><FormDescription>Sube una nueva imagen para reemplazar la actual si es necesario.</FormDescription></FormItem>
         <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Ubicación</FormLabel><FormControl><Input placeholder="Ej: Madrid, España" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
         <FormField control={form.control} name="locationType" render={({ field }) => (<FormItem><FormLabel>Tipo de Ubicación</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona el tipo de ubicación" /></SelectTrigger></FormControl><SelectContent><SelectItem value="ON_SITE">Presencial</SelectItem><SelectItem value="REMOTE">Remoto</SelectItem><SelectItem value="HYBRID">Híbrido</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="salaryRangeMin" render={({ field }) => (<FormItem><FormLabel>Salario Mínimo (€)</FormLabel><FormControl><Input type="number" placeholder="Ej: 30000" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} disabled={isPending}/></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="salaryRangeMax" render={({ field }) => (<FormItem><FormLabel>Salario Máximo (€)</FormLabel><FormControl><Input type="number" placeholder="Ej: 45000" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
        </div>
         <FormField control={form.control} name="jobType" render={({ field }) => (<FormItem><FormLabel>Tipo de Empleo</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona el tipo de empleo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="FULL_TIME">Tiempo Completo</SelectItem><SelectItem value="PART_TIME">Tiempo Parcial</SelectItem><SelectItem value="CONTRACT">Contrato</SelectItem><SelectItem value="INTERNSHIP">Prácticas</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
         <FormField control={form.control} name="applicationUrl" render={({ field }) => (<FormItem><FormLabel>URL de Aplicación (Opcional)</FormLabel><FormControl><Input type="url" placeholder="https://careers.ejemplo.com/apply" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
         <FormField control={form.control} name="applicationEmail" render={({ field }) => (<FormItem><FormLabel>Email de Aplicación (Opcional)</FormLabel><FormControl><Input type="email" placeholder="rrhh@ejemplo.com" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
         <FormField control={form.control} name="applicationDeadline" render={({ field }) => (<FormItem><FormLabel>Fecha Límite (Opcional)</FormLabel><FormControl><Input type="date" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
         <FormField control={form.control} name="requiredSkills" render={({ field }) => (<FormItem><FormLabel>Habilidades Requeridas</FormLabel><FormControl><Input placeholder="Ej: React, TypeScript, Node.js" {...field} value={Array.isArray(field.value) ? field.value.join(', ') : ''} onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))} disabled={isPending}/></FormControl><FormDescription>Separadas por comas.</FormDescription><FormMessage /></FormItem>)} />
         <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Estado de la Oferta</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona el estado" /></SelectTrigger></FormControl><SelectContent><SelectItem value="ACTIVE">Activa</SelectItem><SelectItem value="INACTIVE">Inactiva</SelectItem><SelectItem value="FILLED">Cubierta</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
      </form>
    </Form>
  );

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
                  {job.imageUrl && (
                      <div className="relative h-32 w-full">
                          <Image src={job.imageUrl} alt={job.title} layout="fill" objectFit="cover" />
                      </div>
                  )}
                  <CardHeader className="p-4 flex flex-row items-start gap-4">
                      {job.companyLogoUrl && <Image src={job.companyLogoUrl} alt={job.companyName} width={48} height={48} className="rounded-md object-contain border bg-white" />}
                      <div className="flex-grow">
                          <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.companyName}</p>
                      </div>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenSheetForEdit(job)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/jobs/preview/${job.id}`} target="_blank">
                                    <Eye className="mr-2 h-4 w-4" /> Previsualizar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(job.id)} disabled={isPending} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-muted-foreground flex-grow">
                    {job.location} ({job.locationType})
                  </CardContent>
                  <CardFooter className="p-4 pt-0 border-t mt-auto">
                      <Badge className={cn('mt-4', getStatusBadgeClass(job.status))}>{job.status}</Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
        )}

        <Button className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg" size="icon" onClick={handleOpenSheetForCreate}>
          <Plus className="h-6 w-6" />
        </Button>
      
        <SheetContent className="sm:max-w-2xl w-full">
            <SheetHeader>
                <SheetTitle>{editingJob ? 'Editar Oferta de Empleo' : 'Crear Nueva Oferta de Empleo'}</SheetTitle>
                <SheetDescription>
                    {editingJob ? 'Modifica los detalles de la vacante.' : 'Completa los detalles para publicar una nueva vacante.'}
                </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-150px)] pr-6">
                <div className="py-4">
                  {JobForm}
                </div>
            </ScrollArea>
            <SheetFooter>
                <SheetClose asChild>
                    <Button variant="outline">Cancelar</Button>
                </SheetClose>
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
