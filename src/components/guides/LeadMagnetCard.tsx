'use client';

import React, { useState, useTransition, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Download, CheckCircle, Gift } from 'lucide-react';
import type { Guide } from '@/lib/guide/domain/guide.entity';

const DownloadSchema = z.object({
  firstName: z.string().min(2, "Tu nombre es requerido."),
  email: z.string().email("Debe ser un email válido."),
});

type DownloadFormValues = z.infer<typeof DownloadSchema>;

interface LeadMagnetCardProps {
  guide: Guide;
}

export default function LeadMagnetCard({ guide }: LeadMagnetCardProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isSuccess, setIsSuccess] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const form = useForm<DownloadFormValues>({
        resolver: zodResolver(DownloadSchema),
        defaultValues: { firstName: '', email: '' }
    });
    
    const onSubmit = (values: DownloadFormValues) => {
        startTransition(async () => {
             try {
                const response = await fetch('/api/orders/lead-magnet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...values,
                        guideId: guide.id,
                        guideTitle: guide.title,
                    }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error?.message || 'No se pudo registrar la descarga.');
                }
                
                setIsSuccess(true);
                window.open(guide.pdfUrl, '_blank');

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
                toast({ variant: 'destructive', title: 'Error', description: errorMessage });
            }
        });
    };

    if (!isClient) {
        // Render a placeholder or skeleton on the server and initial client render
        return (
            <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-background to-secondary/30">
                 <CardHeader className="text-center items-center">
                    <div className="p-3 bg-primary/10 rounded-full mb-2">
                       <Gift className="w-6 h-6 text-primary"/>
                    </div>
                    <CardTitle className="font-headline text-xl">¡Descarga Gratis!</CardTitle>
                    <CardDescription>Consigue nuestra "{guide.title}" y recibe más consejos en tu email.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-10 bg-muted rounded-md animate-pulse"></div>
                        <div className="h-10 bg-muted rounded-md animate-pulse"></div>
                        <div className="h-10 bg-primary/50 rounded-md animate-pulse"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-background to-secondary/30">
            {isSuccess ? (
                 <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                    <h3 className="text-lg font-bold font-headline">¡Gracias!</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                       Tu descarga ha comenzado. ¡Esperamos que la guía te sea de gran ayuda!
                    </p>
                </CardContent>
            ) : (
                <>
                    <CardHeader className="text-center items-center">
                        <div className="p-3 bg-primary/10 rounded-full mb-2">
                           <Gift className="w-6 h-6 text-primary"/>
                        </div>
                        <CardTitle className="font-headline text-xl">¡Descarga Gratis!</CardTitle>
                        <CardDescription>Consigue nuestra "{guide.title}" y recibe más consejos en tu email.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel className="sr-only">Nombre</FormLabel><FormControl><Input placeholder="Tu nombre" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel className="sr-only">Email</FormLabel><FormControl><Input type="email" placeholder="Tu email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Descargar Guía
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </>
            )}
        </Card>
    );
}
