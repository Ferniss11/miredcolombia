'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { JobPosting } from '@/lib/job-posting/domain/job-posting.entity';
import { JobPostingFormSchema, JobPostingFormValues } from '@/lib/types';
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

type JobFormProps = {
  isPending: boolean;
  onSubmit: (values: JobPostingFormValues) => void;
  jobToEdit?: JobPosting | null;
  form: ReturnType<typeof useForm<JobPostingFormValues>>;
};

export default function JobForm({ isPending, onSubmit, jobToEdit, form }: JobFormProps) {
  
  useEffect(() => {
    if (jobToEdit) {
      form.reset({
        ...jobToEdit,
        salaryRangeMin: jobToEdit.salaryRange?.min,
        salaryRangeMax: jobToEdit.salaryRange?.max,
        applicationDeadline: jobToEdit.applicationDeadline ? new Date(jobToEdit.applicationDeadline).toISOString().split('T')[0] : '',
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
  }, [jobToEdit, form]);

  return (
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
}
