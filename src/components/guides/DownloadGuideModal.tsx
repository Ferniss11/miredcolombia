// src/components/guides/DownloadGuideModal.tsx
'use client';

import { useState, useTransition } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { Guide } from '@/lib/guide/domain/guide.entity';
import Image from 'next/image';

const DownloadSchema = z.object({
  firstName: z.string().min(2, "Tu nombre es requerido."),
  email: z.string().email("Debe ser un email válido."),
  phone: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, { message: "Debes aceptar los términos." })
});

type DownloadFormValues = z.infer<typeof DownloadSchema>;

interface DownloadGuideModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    guide: Guide;
}

export default function DownloadGuideModal({ isOpen, onOpenChange, guide }: DownloadGuideModalProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<DownloadFormValues>({
        resolver: zodResolver(DownloadSchema),
        defaultValues: { firstName: '', email: '', phone: '', agreeToTerms: false }
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
                
                toast({
                    title: '¡Gracias!',
                    description: 'La descarga comenzará en breve.',
                });
                setIsSuccess(true);
                window.open(guide.pdfUrl, '_blank');

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
                toast({ variant: 'destructive', title: 'Error', description: errorMessage });
            }
        });
    };
    
    // Reset state when dialog is closed
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setTimeout(() => {
                setIsSuccess(false);
                form.reset();
            }, 300);
        }
        onOpenChange(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-4xl p-0">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left Column: Guide Info */}
                    <div className="p-8 bg-secondary/50 dark:bg-card/50 flex flex-col justify-center rounded-l-lg">
                        <Image
                            src={guide.coverImageUrl}
                            alt={guide.title}
                            width={400}
                            height={200}
                            className="w-full h-auto object-cover rounded-lg shadow-md mb-6"
                        />
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-headline">{guide.title}</DialogTitle>
                            <DialogDescription className="text-base pt-2">
                                {guide.description}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    
                    {/* Right Column: Form or Success Message */}
                    <div className="p-8">
                        {isSuccess ? (
                             <div className="flex flex-col items-center justify-center text-center h-full">
                                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                                <h2 className="text-2xl font-bold font-headline">¡Listo!</h2>
                                <p className="text-muted-foreground mt-2">
                                   Tu descarga debería haber comenzado. ¡Esperamos que la guía te sea de gran ayuda!
                                </p>
                                <Button onClick={() => handleOpenChange(false)} className="mt-6">Cerrar</Button>
                            </div>
                        ) : (
                            <>
                                <DialogHeader className="mb-6">
                                    <DialogTitle>Completa tus datos para descargar</DialogTitle>
                                    <DialogDescription>
                                        Recibirás la guía y te mantendremos informado con nuestras novedades.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Tu nombre" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono (Opcional)</FormLabel><FormControl><Input placeholder="+34 600 000 000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="agreeToTerms" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel className="text-xs">Acepto los <Link href="/legal/terminos" className="text-primary hover:underline">términos</Link> y la <Link href="/legal/privacidad" className="text-primary hover:underline">política de privacidad</Link>.</FormLabel><FormMessage /></div></FormItem>)} />
                                        <Button type="submit" className="w-full" disabled={isPending}>
                                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                            Descargar Ahora
                                        </Button>
                                    </form>
                                </Form>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}