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


const Step2Payment = ({ plan, user, userProfile }: { plan: ValeriaPlan, user: any, userProfile: any }) => {
    const [isRedirecting, startRedirectTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        // Automatically trigger redirect when this component mounts
        startRedirectTransition(async () => {
            const result = await createSubscriptionCheckoutSessionAction({
                priceId: plan.id,
                userId: user.uid,
                userEmail: user.email,
            });

            if (result.error) {
                toast({
                    variant: 'destructive',
                    title: 'Error al Iniciar Pago',
                    description: result.error,
                });
            } else if (result.sessionId) {
                // Redirect to Stripe's hosted checkout page
                window.location.href = `/api/stripe/checkout?sessionId=${result.sessionId}`;
            }
        });
    }, [plan, user, toast]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-bold font-headline">Redirigiendo a Pago Seguro</h2>
            <p className="text-muted-foreground mt-2">
                Espera un momento mientras te redirigimos a la página de pago segura de Stripe para completar tu suscripción al <strong>Plan {plan.name}</strong>.
            </p>
        </div>
    );
};


export default function CheckoutSheet({ isOpen, onOpenChange, plan }: CheckoutSheetProps) {
    const [step, setStep] = useState(1);
    const { user, userProfile, signUpWithEmail } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();

    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: { name: '', email: '', password: '', acceptTerms: false },
    });

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(1);
                form.reset();
            }, 300);
        }
    }, [isOpen, form]);

    useEffect(() => {
        if (user && userProfile && step === 1) {
            setStep(2);
        }
    }, [user, userProfile, step]);

    const handleSignUp = async (values: SignUpFormValues) => {
        startTransition(async () => {
            const { error } = await signUpWithEmail(values.name, values.email, values.password, 'User');
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Ahora puedes completar tu compra.' });
                // The useEffect above will handle moving to step 2
            }
        });
    };
    
    if (!plan) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
                <ScrollArea className="flex-1">
                <div className="p-6">
                    {step === 1 && !user && (
                        <>
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
                        </>
                    )}
                    {(step === 2 || user) && (
                        <Step2Payment plan={plan} user={user} userProfile={userProfile} />
                    )}
                </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
