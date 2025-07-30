
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import {
  getJobPostingByIdAction,
  updateJobPostingAction,
} from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import { JobPostingFormSchema, JobPostingFormValues } from '@/lib/types';
import { JobPosting } from '@/lib/job-posting/domain/job-posting.entity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const EditJobPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const jobId = Array.isArray(params.id) ? params.id[0] : params.id;

  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(JobPostingFormSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (jobId) {
      setIsLoading(true);
      getJobPostingByIdAction(jobId)
        .then(result => {
          if (result.success && result.data) {
            setJob(result.data);
            form.reset({
              ...result.data,
              salaryRangeMin: result.data.salaryRange?.min,
              salaryRangeMax: result.data.salaryRange?.max,
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: result.error || 'No se pudo cargar la oferta de empleo.',
            });
            router.push('/dashboard/jobs');
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [jobId, router, toast, form]);

  const onSubmit = (values: JobPostingFormValues) => {
    startTransition(async () => {
      try {
        const imageInput = document.querySelector<HTMLInputElement>('input[name="imageFile"]');
        const imageFile = imageInput?.files?.[0];

        const companyLogoInput = document.querySelector<HTMLInputElement>('input[name="companyLogoFile"]');
        const companyLogoFile = companyLogoInput?.files?.[0];

        const result = await updateJobPostingAction(jobId, values, imageFile, companyLogoFile);

        if (result.success) {
          toast({
            title: 'Oferta Actualizada',
            description: 'La oferta de empleo ha sido actualizada exitosamente.',
          });
          router.push('/dashboard/jobs');
        } else {
          toast({
            variant: 'destructive',
            title: 'Error al Actualizar',
            description: result.error || 'Hubo un problema al actualizar la oferta.',
          });
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error Inesperado',
          description: error.message || 'Ocurrió un error inesperado.',
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!job) {
    return (
        <div className="text-center py-10">
            <p>No se encontró la oferta de empleo.</p>
            <Button asChild variant="link" className="mt-4">
                <Link href="/dashboard/jobs">Volver al listado</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Editar Oferta de Empleo</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Listado
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Oferta</CardTitle>
          <CardDescription>Modifica los campos necesarios y guarda los cambios.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Título del Puesto</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descripción del Puesto</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="companyName" render={({ field }) => (
                <FormItem><FormLabel>Nombre de la Empresa</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormItem><FormLabel>Logo de la Empresa (Opcional)</FormLabel><FormControl><Input type="file" accept="image/*" name="companyLogoFile" disabled={isPending} /></FormControl><FormDescription>Sube un nuevo logo para reemplazar el actual.</FormDescription></FormItem>
              <FormItem><FormLabel>Imagen de la Oferta (Opcional)</FormLabel><FormControl><Input type="file" accept="image/*" name="imageFile" disabled={isPending} /></FormControl><FormDescription>Sube una nueva imagen para reemplazar la actual.</FormDescription></FormItem>
               <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Ubicación</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="locationType" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Ubicación</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="ON_SITE">Presencial</SelectItem><SelectItem value="REMOTE">Remoto</SelectItem><SelectItem value="HYBRID">Híbrido</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="salaryRangeMin" render={({ field }) => (
                      <FormItem><FormLabel>Salario Mínimo (€)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} disabled={isPending}/></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="salaryRangeMax" render={({ field }) => (
                      <FormItem><FormLabel>Salario Máximo (€)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>
              <FormField control={form.control} name="jobType" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Empleo</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="FULL_TIME">Tiempo Completo</SelectItem><SelectItem value="PART_TIME">Tiempo Parcial</SelectItem><SelectItem value="CONTRACT">Contrato</SelectItem><SelectItem value="INTERNSHIP">Prácticas</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="applicationUrl" render={({ field }) => (
                <FormItem><FormLabel>URL de Aplicación</FormLabel><FormControl><Input type="url" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="applicationEmail" render={({ field }) => (
                <FormItem><FormLabel>Email de Aplicación</FormLabel><FormControl><Input type="email" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="applicationDeadline" render={({ field }) => (
                <FormItem><FormLabel>Fecha Límite</FormLabel><FormControl><Input type="date" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="requiredSkills" render={({ field }) => (
                <FormItem><FormLabel>Habilidades Requeridas</FormLabel><FormControl><Input {...field} value={Array.isArray(field.value) ? field.value.join(', ') : ''} onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))} disabled={isPending}/></FormControl><FormDescription>Separadas por comas.</FormDescription><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="ACTIVE">Activa</SelectItem><SelectItem value="INACTIVE">Inactiva</SelectItem><SelectItem value="FILLED">Cubierta</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditJobPage;
