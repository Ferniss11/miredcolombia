
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { createSubscriptionCheckoutSessionAction } from '@/lib/payment-actions';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';
import type { ValeriaPlan } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

interface CheckoutSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    plan: ValeriaPlan | null;
}

// --- Schemas ---
const SignUpSchema = z.object({
    name: z.string().min(2, "El nombre es requerido."),
    email: z.string().email("Debe ser un email válido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    acceptTerms: z.boolean().refine((data) => data === true, {
        message: 'Debes aceptar los términos y condiciones para continuar.',
    }),
});
type SignUpFormValues = z.infer<typeof SignUpSchema>;


// --- Sub-components for Steps ---
const SignUpStep = ({ form, onSubmit, isSubmitting }: { form: any, onSubmit: any, isSubmitting: boolean }) => (
    <>
        <SheetHeader>
            <SheetTitle className="text-2xl flex items-center gap-2"><UserPlus />Paso 1: Crea tu cuenta</SheetTitle>
            <SheetDescription>Es gratis y solo toma un minuto. Así podrás gestionar tu suscripción.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre y Apellidos</FormLabel><FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="acceptTerms" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Acepto los <Link href="/legal/terminos" className="text-primary hover:underline">términos y condiciones</Link>.</FormLabel><FormMessage /></div></FormItem>)} />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear cuenta y continuar
                    </Button>
                </form>
            </Form>
        </div>
    </>
);

const PaymentStep = ({ plan, onConfirmPayment, isSubmitting }: { plan: ValeriaPlan, onConfirmPayment: () => void, isSubmitting: boolean }) => (
     <>
        <SheetHeader>
            <SheetTitle className="text-2xl flex items-center gap-2"><CheckCircle className="text-green-500" />Paso 2: Confirma tu plan</SheetTitle>
            <SheetDescription>Estás a punto de suscribirte. Serás redirigido a Stripe para completar el pago de forma segura.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
             <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>Resumen de tu suscripción</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{typeof plan.price === 'number' ? `${plan.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€` : plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.priceDetails}</span></div>
                    <ul className="space-y-2 mt-4 text-sm">
                        {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500"/>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
             <Button onClick={onConfirmPayment} className="w-full mt-6" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Pagar con Stripe"}
                <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
        </div>
    </>
);


// --- Main Component ---
export default function CheckoutSheet({ isOpen, onOpenChange, plan }: CheckoutSheetProps) {
    const { signUpWithEmail, user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();
    const [step, setStep] = useState(1);

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
    
    // If a user is already logged in when the sheet opens, skip to step 2.
    useEffect(() => {
        if (user && isOpen) {
            setStep(2);
        }
    }, [user, isOpen])

    const handleSignUp = async (values: SignUpFormValues) => {
        startTransition(async () => {
            const { error } = await signUpWithEmail(values.name, values.email, values.password, 'User');
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Ahora puedes confirmar tu plan.' });
                // The useEffect hook will now detect the logged-in user and move to step 2.
            }
        });
    };
    
    const handleConfirmAndPay = async () => {
        if (!user || !plan) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se ha podido identificar al usuario o el plan.' });
            return;
        }
        startTransition(async () => {
            const result = await createSubscriptionCheckoutSessionAction({
                priceId: plan.id,
                userId: user.uid,
                userEmail: user.email!,
            });
            
            if (result.error || !result.checkoutUrl) {
                toast({ variant: 'destructive', title: 'Error de Pago', description: result.error || 'No se pudo generar el enlace de pago.' });
            } else {
                window.location.href = result.checkoutUrl;
            }
        });
    };
    
    if (!plan) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
                <ScrollArea className="flex-1">
                    <div className="p-6">
                        {step === 1 && <SignUpStep form={form} onSubmit={handleSignUp} isSubmitting={isSubmitting} />}
                        {step === 2 && <PaymentStep plan={plan} onConfirmPayment={handleConfirmAndPay} isSubmitting={isSubmitting} />}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
