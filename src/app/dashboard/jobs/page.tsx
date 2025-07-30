"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';

import { JobPostingFormSchema, JobPostingFormValues } from '@/lib/types';
import { JobPosting } from '@/lib/job-posting/domain/job-posting.entity';
import { createJobPostingAction, getJobPostingsAction, deleteJobPostingAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import { useAuth } from '@/context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const JobsPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user, userProfile, loading } = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(JobPostingFormSchema),
    defaultValues: {
      title: '',
      description: '',
      companyName: '',
      location: '',
      locationType: 'ON_SITE',
      salaryRangeMin: 0,
      salaryRangeMax: 0,
      jobType: 'FULL_TIME',
      applicationUrl: '',
      applicationEmail: '',
      applicationDeadline: '',
      requiredSkills: [],
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    const fetchJobPostings = async () => {
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
    };
    fetchJobPostings();
  }, [toast]);

  const onSubmit = async (values: JobPostingFormValues) => {
    if (!user || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: 'Usuario no autenticado o perfil no cargado. Por favor, inicia sesión de nuevo.',
      });
      return;
    }

    if (userProfile.role !== 'Admin' && userProfile.role !== 'Advertiser') {
      toast({
        variant: 'destructive',
        title: 'Permiso Denegado',
        description: 'No tienes permiso para crear ofertas de empleo.',
      });
      return;
    }

    // The role is now guaranteed to be 'Admin' or 'Advertiser'.
    // We also convert it to lowercase to match the JobPosting entity requirement.
    const creatorRole = userProfile.role.toLowerCase() as 'admin' | 'advertiser';

    startTransition(async () => {
      try {
        const imageInput = document.querySelector<HTMLInputElement>('input[name="imageFile"]');
        const imageFile = imageInput?.files?.[0];

        const companyLogoInput = document.querySelector<HTMLInputElement>('input[name="companyLogoFile"]');
        const companyLogoFile = companyLogoInput?.files?.[0];

        // The server action will now be responsible for timestamps.
        // We pass the clean form values and the validated creator info.
        const result = await createJobPostingAction(
          {
            ...values,
            creatorId: user.uid,
            creatorRole: creatorRole,
          },
          imageFile,
          companyLogoFile
        );

        if (result.success) {
          toast({
            title: 'Oferta de Empleo Creada',
            description: 'La oferta de empleo ha sido publicada exitosamente.',
          });
          form.reset();
          const updatedPostsResult = await getJobPostingsAction();
          if (updatedPostsResult.success) {
            setJobPostings(updatedPostsResult.data || []);
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Error al Crear Oferta',
            description: result.error || 'Hubo un problema al crear la oferta de empleo.',
          });
        }
      } catch (error: any) {
        console.error('Error creating job posting:', error);
        toast({
          variant: 'destructive',
          title: 'Error al Crear Oferta',
          description: error.message || 'Hubo un problema al crear la oferta de empleo.',
        });
      }
    });
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta oferta de empleo?')) {
      return;
    }
    startTransition(async () => {
      try {
        const result = await deleteJobPostingAction(jobId);
        if (result.success) {
          toast({
            title: 'Oferta Eliminada',
            description: 'La oferta de empleo ha sido eliminada exitosamente.',
          });
          const updatedPostsResult = await getJobPostingsAction(); // Refresh list
          if (updatedPostsResult.success) {
            setJobPostings(updatedPostsResult.data || []);
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Error al Eliminar Oferta',
            description: result.error || 'Hubo un problema al eliminar la oferta de empleo.',
          });
        }
      } catch (error: any) {
        console.error('Error deleting job posting:', error);
        toast({
          variant: 'destructive',
          title: 'Error al Eliminar Oferta',
          description: error.message || 'Hubo un problema al eliminar la oferta de empleo.',
        });
      }
    });
  };

  const getStatusBadgeClass = (status: JobPosting['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'FILLED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Gestión de Ofertas de Empleo</h1>

      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Oferta de Empleo</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Puesto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Desarrollador Frontend Senior" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del Puesto</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe las responsabilidades, requisitos y beneficios..."
                        className="min-h-[150px]"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Mi Empresa S.L." {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Madrid, España" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Ubicación</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de ubicación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ON_SITE">Presencial</SelectItem>
                        <SelectItem value="REMOTE">Remoto</SelectItem>
                        <SelectItem value="HYBRID">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="salaryRangeMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salario Mínimo (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ej: 30000"
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salaryRangeMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salario Máximo (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ej: 45000"
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Empleo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de empleo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Tiempo Completo</SelectItem>
                        <SelectItem value="PART_TIME">Tiempo Parcial</SelectItem>
                        <SelectItem value="CONTRACT">Contrato</SelectItem>
                        <SelectItem value="INTERNSHIP">Prácticas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicationUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de Aplicación</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="Ej: https://careers.ejemplo.com/apply" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Aplicación</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Ej: rrhh@ejemplo.com" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicationDeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Límite de Aplicación</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiredSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habilidades Requeridas (separadas por comas)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: React, TypeScript, Node.js"
                        {...field}
                        value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                        onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Imagen de la Oferta</FormLabel>
                <FormControl>
                  <Input type="file" accept="image/*" name="imageFile" disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Logo de la Empresa</FormLabel>
                <FormControl>
                  <Input type="file" accept="image/*" name="companyLogoFile" disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado de la Oferta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activa</SelectItem>
                        <SelectItem value="INACTIVE">Inactiva</SelectItem>
                        <SelectItem value="FILLED">Cubierta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Oferta
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold font-headline mt-8">Ofertas de Empleo Existentes</h2>
      <Card>
        <CardContent className="p-0">
          {isLoadingJobs ? (
            <div className="p-4 text-center text-muted-foreground">Cargando ofertas...</div>
          ) : jobPostings.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No hay ofertas de empleo publicadas.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobPostings.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {job.imageUrl && (
                          <Image src={job.imageUrl} alt={job.title} width={40} height={40} className="rounded-md object-cover" />
                        )}
                        {job.title}
                      </div>
                    </TableCell>
                    <TableCell>{job.companyName}</TableCell>
                    <TableCell>{job.location} ({job.locationType})</TableCell>
                    <TableCell>{job.jobType}</TableCell>
                    <TableCell>
                      <Badge className={cn(getStatusBadgeClass(job.status))}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/jobs/${job.id}/edit`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(job.id)} disabled={isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsPage;
