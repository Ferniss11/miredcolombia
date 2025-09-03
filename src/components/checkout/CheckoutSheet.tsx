'use client';

import React, { useState, useEffect, useTransition } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Lock, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { createSubscriptionCheckoutSessionAction } from '@/lib/payment-actions';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';
import type { ValeriaPlan } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';


interface CheckoutSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    plan: ValeriaPlan | null;
}

const SignUpSchema = z.object({
    name: z.string().min(2, "El nombre es requerido."),
    email: z.string().email("Debe ser un email válido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    acceptTerms: z.boolean().refine((data) => data === true, {
        message: 'Debes aceptar los términos y condiciones para continuar.',
    }),
});
type SignUpFormValues = z.infer<typeof SignUpSchema>;


export default function CheckoutSheet({ isOpen, onOpenChange, plan }: CheckoutSheetProps) {
    const { signUpWithEmail } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, startTransition] = useTransition();

    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: { name: '', email: '', password: '', acceptTerms: false },
    });

    const handleSignUp = async (values: SignUpFormValues) => {
        startTransition(async () => {
            const { error } = await signUpWithEmail(values.name, values.email, values.password, 'User');
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Ahora puedes seleccionar tu plan de nuevo para pagar.' });
                // Close the sheet after successful sign-up
                onOpenChange(false);
                // Optionally, you can refresh the page or use router to ensure auth state is synced everywhere
                router.refresh(); 
            }
        });
    };
    
    if (!plan) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <SheetHeader>
                            <SheetTitle className="text-2xl flex items-center gap-2"><UserPlus/>Paso 1: Crea tu cuenta para continuar</SheetTitle>
                            <SheetDescription>Es gratis y solo toma un minuto. Así podrás gestionar tu suscripción al <strong>Plan {plan.name}</strong>.</SheetDescription>
                        </SheetHeader>
                        <div className="py-4">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre y Apellidos</FormLabel><FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="acceptTerms" render={({ field }) => ( <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Acepto los <Link href="/legal/terminos" className="text-primary hover:underline">términos y condiciones</Link>.</FormLabel><FormMessage /></div></FormItem>)} />
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Crear cuenta y Pagar
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
