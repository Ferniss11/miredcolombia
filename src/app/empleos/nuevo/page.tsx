
'use client';

import React, { useState, useTransition } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { createJobPostingAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import { JobPostingFormSchema, JobPostingFormValues } from '@/lib/types';
import Link from 'next/link';

// Schema for guest posts needs an email for contact
const GuestJobPostingFormSchema = JobPostingFormSchema.extend({
    applicationEmail: z.string().email("Se requiere un email de contacto válido."),
});


export default function PostNewJobPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<z.infer<typeof GuestJobPostingFormSchema>>({
        resolver: zodResolver(GuestJobPostingFormSchema),
        defaultValues: {
            title: '',
            description: '',
            companyName: '',
            location: '',
            locationType: 'ON_SITE',
            jobType: 'FULL_TIME',
            applicationEmail: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof GuestJobPostingFormSchema>) => {
        startTransition(async () => {
            try {
                const result = await createJobPostingAction(values);
                if (result.success) {
                    toast({
                        title: "¡Oferta Enviada!",
                        description: "Tu oferta de empleo ha sido enviada para revisión. Un administrador la aprobará pronto.",
                    });
                    setIsSubmitted(true);
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error al Enviar la Oferta',
                        description: result.error || 'Hubo un problema.',
                    });
                }
            } catch (error: any) {
                console.error('Error creating guest job posting:', error);
                toast({ variant: 'destructive', title: 'Error Inesperado', description: error.message });
            }
        });
    };

    if (isSubmitted) {
        return (
            <div className="container mx-auto max-w-2xl py-12 text-center">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">🎉 ¡Gracias por tu publicación!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Hemos recibido tu oferta de empleo y nuestro equipo la revisará en breve. Recibirás una notificación por correo electrónico una vez que sea aprobada y publicada en nuestro portal.
                        </p>
                        <Button asChild>
                            <Link href="/empleos">Volver al Portal de Empleo</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl py-12">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline">Publica una Oferta de Empleo</CardTitle>
                    <CardDescription>
                        Completa el formulario para publicar una vacante. Un administrador la revisará antes de que sea visible para todos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título del Puesto</FormLabel><FormControl><Input placeholder="Ej: Desarrollador Frontend Senior" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Nombre de la Empresa</FormLabel><FormControl><Input placeholder="Ej: Mi Empresa S.L." {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Ubicación</FormLabel><FormControl><Input placeholder="Ej: Madrid, España" {...field} disabled={isPending} /></FormControl><FormDescription>Especifica ciudad y país.</FormDescription><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="applicationEmail" render={({ field }) => (<FormItem><FormLabel>Email de Contacto</FormLabel><FormControl><Input type="email" placeholder="tu@email.com" {...field} disabled={isPending} /></FormControl><FormDescription>Este email se usará para que los candidatos apliquen y para notificarte.</FormDescription><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción Completa del Puesto</FormLabel><FormControl><Textarea placeholder="Describe las responsabilidades, requisitos, beneficios, etc." className="min-h-[200px]" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <FormField control={form.control} name="jobType" render={({ field }) => (<FormItem><FormLabel>Tipo de Contrato</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="FULL_TIME">Tiempo Completo</SelectItem><SelectItem value="PART_TIME">Tiempo Parcial</SelectItem><SelectItem value="CONTRACT">Contrato</SelectItem><SelectItem value="INTERNSHIP">Prácticas</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="locationType" render={({ field }) => (<FormItem><FormLabel>Modalidad</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="ON_SITE">Presencial</SelectItem><SelectItem value="REMOTE">Remoto</SelectItem><SelectItem value="HYBRID">Híbrido</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            </div>
                            
                            <div className="flex justify-end pt-6">
                                <Button type="submit" size="lg" disabled={isPending}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Enviar para Revisión
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
