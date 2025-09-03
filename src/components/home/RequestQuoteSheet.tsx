'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

interface RequestQuoteSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    packageName: string;
}

const QuoteFormSchema = z.object({
  firstName: z.string().min(2, "El nombre es requerido."),
  email: z.string().email("Debe ser un email válido."),
  phone: z.string().optional(),
  message: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof QuoteFormSchema>;

export default function RequestQuoteSheet({ isOpen, onOpenChange, packageName }: RequestQuoteSheetProps) {
    const [isPending, startTransition] = useTransition();
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(QuoteFormSchema),
        defaultValues: { firstName: '', email: '', phone: '', message: '' }
    });
    
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                form.reset();
                setIsSuccess(false);
            }, 300);
        }
    }, [isOpen, form]);

    const onSubmit = (values: QuoteFormValues) => {
        startTransition(async () => {
            try {
                // We use the same endpoint as the lead magnet, but with different item details
                const response = await fetch('/api/orders/lead-magnet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...values,
                        guideId: packageName.toLowerCase().replace(/\s/g, '_'), // e.g., 'pack_onboarding'
                        guideTitle: `Solicitud de Presupuesto: ${packageName}`,
                    }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error?.message || 'No se pudo enviar la solicitud.');
                }
                
                toast({ title: '¡Solicitud Enviada!', description: 'Nuestro equipo se pondrá en contacto contigo en breve.' });
                setIsSuccess(true);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
                toast({ variant: 'destructive', title: 'Error', description: errorMessage });
            }
        });
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
                 <SheetHeader className="p-6 pb-4">
                    <SheetTitle>Solicitar Presupuesto: {packageName}</SheetTitle>
                    <SheetDescription>
                        Completa tus datos y cuéntanos qué necesitas. Un asesor se pondrá en contacto contigo para ofrecerte una solución a medida.
                    </SheetDescription>
                </SheetHeader>
                
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 flex-1">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold font-headline">¡Gracias!</h2>
                        <p className="text-muted-foreground mt-2">
                           Hemos recibido tu solicitud. Uno de nuestros asesores se comunicará contigo muy pronto.
                        </p>
                        <Button onClick={() => onOpenChange(false)} className="mt-6">Cerrar</Button>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-6">
                                    <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="Tu nombre y apellidos" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="+34 600 000 000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={form.control} name="message" render={({ field }) => (<FormItem><FormLabel>Mensaje Adicional</FormLabel><FormControl><Textarea placeholder="Cuéntanos más sobre tu caso para poder ayudarte mejor." rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </ScrollArea>
                            <SheetFooter className="p-6 mt-auto border-t bg-background">
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Enviar Solicitud
                                </Button>
                            </SheetFooter>
                        </form>
                    </Form>
                )}
            </SheetContent>
        </Sheet>
    )
}
