
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Check, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { createSubscriptionCheckoutSessionAction } from '@/lib/payment-actions';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';
import type { ValeriaPlan } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';


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


// --- Step Components ---

// Step 1: Sign Up
const SignUpStep = ({ form, onSubmit, isSubmitting, planName }: { form: any, onSubmit: (v: any) => void, isSubmitting: boolean, planName: string }) => (
     <>
        <SheetHeader>
            <SheetTitle className="text-2xl flex items-center gap-2"><UserPlus/>Paso 1: Crea tu cuenta</SheetTitle>
            <SheetDescription>Es gratis y solo toma un minuto. Así podrás gestionar tu suscripción al <strong>Plan {planName}</strong>.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre y Apellidos</FormLabel><FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="acceptTerms" render={({ field }) => ( <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Acepto los <Link href="/legal/terminos" className="text-primary hover:underline">términos y condiciones</Link>.</FormLabel><FormMessage /></div></FormItem>)} />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear cuenta y continuar al pago
                    </Button>
                </form>
            </Form>
        </div>
    </>
);

// Step 2: Confirm and Pay
const PaymentStep = ({ plan, onConfirm, isProcessing }: { plan: ValeriaPlan, onConfirm: () => void, isProcessing: boolean }) => (
    <>
        <SheetHeader>
            <SheetTitle className="text-2xl flex items-center gap-2"><Lock/>Paso 2: Confirmar y Pagar</SheetTitle>
            <SheetDescription>Estás a punto de suscribirte al <strong>Plan {plan.name}</strong>. Revisa los detalles y completa el pago en la página segura de Stripe.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
            <Card>
                <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.priceDetails}</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-4xl font-bold">{plan.price}€</div>
                     <ul className="space-y-2 text-sm text-muted-foreground mt-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span>{feature}</span>
                          </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            <Button onClick={onConfirm} disabled={isProcessing} className="w-full mt-6">
                 {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pagar con Stripe
            </Button>
        </div>
    </>
);


// --- Main Component ---
export default function CheckoutSheet({ isOpen, onOpenChange, plan }: CheckoutSheetProps) {
    const { signUpWithEmail, user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, startTransition] = useTransition();
    const [step, setStep] = useState(1);

    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: { name: '', email: '', password: '', acceptTerms: false },
    });

    // Reset sheet state when it closes or user changes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(1);
                form.reset();
            }, 300); // Delay to allow animation
        } else {
            // If the sheet opens and the user is already logged in, skip to step 2
            if (user) {
                setStep(2);
            } else {
                setStep(1);
            }
        }
    }, [isOpen, user, form]);

    const handleSignUp = async (values: SignUpFormValues) => {
        startTransition(async () => {
            const { error } = await signUpWithEmail(values.name, values.email, values.password, 'User');
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Ahora puedes completar tu pago.' });
                // The useEffect will detect the new user and move to step 2 automatically
            }
        });
    };

    const handleConfirmAndPay = async () => {
        if (!user || !plan || plan.id === 'plan_free') return;
        
        startTransition(async () => {
            const result = await createSubscriptionCheckoutSessionAction({
                priceId: plan.id,
                userId: user.uid,
                userEmail: user.email!,
            });

            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al Iniciar Pago', description: result.error });
            } else if (result.sessionId) {
                window.location.href = `/api/stripe/checkout?sessionId=${result.sessionId}`;
            }
        });
    }
    
    if (!plan) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
                <ScrollArea className="flex-1">
                    <div className="p-6">
                       {step === 1 ? (
                           <SignUpStep 
                               form={form}
                               onSubmit={handleSignUp}
                               isSubmitting={isSubmitting}
                               planName={plan.name}
                           />
                       ) : (
                           <PaymentStep
                               plan={plan}
                               onConfirm={handleConfirmAndPay}
                               isProcessing={isSubmitting}
                           />
                       )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
