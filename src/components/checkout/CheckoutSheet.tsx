'use client';

import React, { useState, useEffect, useTransition } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Check, Lock, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import StripeCheckoutForm from './StripeCheckoutForm';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import Link from 'next/link';
import type { ValeriaPlan } from '@/lib/types';


interface CheckoutSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    plan: ValeriaPlan | null;
}

const SignUpSchema = z.object({
    name: z.string().min(2, "El nombre es requerido."),
    email: z.string().email("Debe ser un email válido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    phone: z.string().min(7, "El teléfono es requerido.").optional(),
    wantsWhatsAppContact: z.boolean().default(false),
    comments: z.string().optional(),
    acceptTerms: z.boolean().refine((data) => data === true, {
        message: 'Debes aceptar los términos y condiciones para continuar.',
    }),
});
type SignUpFormValues = z.infer<typeof SignUpSchema>;


export default function CheckoutSheet({ isOpen, onOpenChange, plan }: CheckoutSheetProps) {
    const [step, setStep] = useState(1);
    const { user, userProfile, signUpWithEmail } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();

    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: { name: '', email: '', password: '', phone: '', wantsWhatsAppContact: false, comments: '', acceptTerms: false },
    });

    useEffect(() => {
        if (!isOpen) {
            // Reset state when sheet is closed
            setTimeout(() => {
                setStep(1);
                form.reset();
            }, 300);
        }
    }, [isOpen, form]);

    useEffect(() => {
        // If user logs in while sheet is open, move to step 2
        if (user && userProfile && step === 1) {
            setStep(2);
        }
    }, [user, userProfile, step]);

    const handleSignUp = async (values: SignUpFormValues) => {
        startTransition(async () => {
            const { error } = await signUpWithEmail(`${values.name}`, values.email, values.password, 'User');
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Ahora puedes completar tu compra.' });
                // The useEffect above will detect the new user and move to step 2
            }
        });
    };
    
    if (!plan) return null;
    
    const formatPrice = (price: number | string) => {
        const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.,]/g, '').replace(',', '.')) : price;
        if (isNaN(numericPrice)) return 'Precio no disponible';
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(numericPrice);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
                <ScrollArea className="flex-1">
                <div className="p-6">
                    {step === 1 && (
                        <>
                            <SheetHeader>
                                <SheetTitle className="text-2xl flex items-center gap-2"><UserPlus/>Paso 1: Crea tu cuenta para continuar</SheetTitle>
                                <SheetDescription>Es gratis y solo toma un minuto. Así podrás gestionar tu suscripción al Plan {plan.name}.</SheetDescription>
                            </SheetHeader>
                            <div className="py-4">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre y Apellidos</FormLabel><FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono (Opcional)</FormLabel><FormControl><Input placeholder="+34 600 000 000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="wantsWhatsAppContact" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Contacto por WhatsApp</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                        <FormField control={form.control} name="comments" render={({ field }) => (<FormItem><FormLabel>Comentarios (Opcional)</FormLabel><FormControl><Textarea placeholder="¿Hay algo más que debamos saber?" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="acceptTerms" render={({ field }) => ( <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><div className="space-y-1 leading-none"><FormLabel>Acepto los <Link href="/legal/terminos" className="text-primary hover:underline">términos y condiciones</Link>.</FormLabel><FormMessage /></div></FormItem>)} />
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Crear cuenta y Pagar
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        </>
                    )}
                    {step === 2 && user && (
                        <>
                            <SheetHeader>
                                <SheetTitle className="text-2xl flex items-center gap-2"><Lock/>Paso 2: Pago Seguro</SheetTitle>
                                <SheetDescription>Estás a un paso de activar tu <strong>Plan {plan.name}</strong>. Completa el pago de forma segura con Stripe.</SheetDescription>
                            </SheetHeader>
                            <div className="py-4">
                               <Card className="bg-secondary/50">
                                    <CardHeader>
                                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold mb-4">{formatPrice(plan.price)} <span className="text-sm font-normal text-muted-foreground">{plan.priceDetails}</span></p>
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start">
                                                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                                <div className="mt-6">
                                     <StripeCheckoutForm item={{...plan, type: 'plan', price: typeof plan.price === 'number' ? plan.price : 0}} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
