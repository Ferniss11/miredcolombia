
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const contactFormSchema = z.object({
    name: z.string().min(2, { message: "El nombre es requerido." }),
    email: z.string().email({ message: "El email no es válido." }),
    phone: z.string().min(7, { message: "El teléfono es requerido." }),
    message: z.string().min(10, { message: "El mensaje debe tener al menos 10 caracteres." }),
    agreeToTerms: z.boolean().refine(val => val === true, { message: "Debes aceptar los términos." })
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
    ownerName: string;
    propertyTitle: string;
}

export default function ContactForm({ ownerName, propertyTitle }: ContactFormProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            message: `Hola ${ownerName}, estoy interesado/a en la propiedad "${propertyTitle}". ¿Podríamos tener más información? Gracias.`,
            agreeToTerms: false
        }
    });

    function onSubmit(data: ContactFormValues) {
        startTransition(() => {
            // Here you would typically send an email or save the inquiry to a database.
            // For now, we'll just simulate a successful submission.
            console.log("Contact form submitted:", data);
            toast({
                title: "Mensaje Enviado",
                description: `Tu consulta para ${ownerName} ha sido enviada. ¡Se pondrán en contacto contigo pronto!`,
            });
            form.reset();
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tu Nombre</FormLabel><FormControl><Input placeholder="Nombre completo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Tu Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Tu Teléfono</FormLabel><FormControl><Input placeholder="+34 600 123 456" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="message" render={({ field }) => (<FormItem><FormLabel>Mensaje</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="agreeToTerms" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel className="text-xs">Acepto que mis datos sean compartidos con el anunciante.</FormLabel>
                             <FormMessage />
                        </div>
                    </FormItem>
                )} />

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Enviar Mensaje
                </Button>
            </form>
        </Form>
    );
}
