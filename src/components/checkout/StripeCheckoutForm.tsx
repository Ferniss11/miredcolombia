'use client';

import React, { useState, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Check, Lock } from 'lucide-react';
import { createPaymentIntentAction, createOrderAction } from '@/lib/payment-actions';
import { useAuth } from '@/context/AuthContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MigrationPackage, MigrationService, ValeriaPlan } from '@/lib/types';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type ItemProp = (MigrationPackage | MigrationService | ValeriaPlan) & { type: 'package' | 'service' | 'plan' };
type CheckoutFormProps = {
  item: ItemProp;
};

const checkoutFormSchema = z.object({
    firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
    email: z.string().email({ message: 'Debe ser un correo electrónico válido.' }),
    phone: z.string().min(7, { message: 'El teléfono es obligatorio.' }),
    wantsWhatsAppContact: z.boolean().default(false),
    comments: z.string().optional(),
    acceptTerms: z.boolean().refine((data) => data === true, {
        message: 'Debes aceptar los términos y condiciones para continuar.',
    }),
});
type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;


// The core multi-step logic component
const CheckoutFormWithSteps = ({ item }: CheckoutFormProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const { user, userProfile } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [firstName, ...lastNameParts] = (userProfile?.name || user?.displayName || '').split(' ');
    const lastName = lastNameParts.join(' ');

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutFormSchema),
        defaultValues: {
            firstName: firstName || '',
            lastName: lastName || '',
            email: userProfile?.email || user?.email || '',
            phone: userProfile?.businessProfile?.phone || '',
            wantsWhatsAppContact: false,
            comments: '',
            acceptTerms: false,
        },
    });

    const handleUserInfoSubmit = () => {
        setStep(2);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) {
            setMessage('El formulario de pago no está listo.');
            return;
        }

        setIsProcessing(true);
        setMessage(null);
        
        // This is only triggered from within the Sheet now, so user should exist.
        if (!user) {
            setMessage('Error de autenticación. Por favor, reinicia el proceso.');
            setIsProcessing(false);
            return;
        }

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (error) {
            setMessage(error.message || 'Ocurrió un error inesperado.');
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            const formData = form.getValues();
            await createOrderAction({
                userId: user.uid,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                wantsWhatsAppContact: formData.wantsWhatsAppContact,
                comments: formData.comments,
                itemId: item.id,
                itemName: item.name,
                amount: typeof item.price === 'number' ? item.price : 0,
                currency: 'eur',
                status: 'succeeded',
                stripePaymentIntentId: paymentIntent.id,
            });
            setStep(4); // Move to success step
        } else {
            setMessage('El pago no se completó. Estado: ' + paymentIntent?.status);
        }

        setIsProcessing(false);
    };
    
    const formatPrice = (price: number | string) => {
        const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.,]/g, '').replace(',', '.')) : price;
        if (isNaN(numericPrice)) return 'Precio no disponible';
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(numericPrice);
    };
    
    // Step 4: Success Screen
    if (step === 4) {
        return (
            <div className="text-center space-y-4 py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold font-headline">¡Gracias por tu compra!</h2>
                <p className="text-muted-foreground">
                    Hemos recibido tu pedido y te enviaremos una confirmación a tu correo electrónico en breve. Si tienes alguna pregunta, no dudes en contactarnos.
                </p>
                 <Button onClick={() => router.push('/dashboard')}>
                    Ir a mi Panel
                </Button>
            </div>
        );
    }
    
     // If the user is logged in, we skip the info form (Step 1)
    useEffect(() => {
        if (user) {
            setStep(2);
        }
    }, [user]);

    // Step 1: User Info
    if (step === 1) {
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUserInfoSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl><Input placeholder="Tu nombre" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apellidos</FormLabel>
                                    <FormControl><Input placeholder="Tus apellidos" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo Electrónico</FormLabel>
                                    <FormControl><Input placeholder="tu@email.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono</FormLabel>
                                    <FormControl><Input placeholder="+34 600 000 000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="wantsWhatsAppContact"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Contacto por WhatsApp</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="comments"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Comentarios (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="¿Hay algo más que debamos saber?" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                            <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                            <FormLabel>
                                Acepto los <Link href="/legal/terminos" className="text-primary hover:underline">términos y condiciones</Link>.
                            </FormLabel>
                            <FormMessage />
                            </div>
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full mt-4">
                        Continuar al Resumen
                    </Button>
                </form>
            </Form>
        );
    }
    
    // Step 2: Summary
    if (step === 2) {
        const formData = form.getValues();
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Resumen del Pedido</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Producto:</span>
                            <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Comprador:</span>
                            <span className="font-medium">{userProfile?.name || 'Invitado'}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{userProfile?.email}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2">
                            <span>Total a Pagar:</span>
                            <span>{formatPrice(item.price)}</span>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => user ? null : setStep(1)} disabled={!!user}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                    <Button onClick={() => setStep(3)}>
                        Continuar al Pago
                    </Button>
                </div>
            </div>
        );
    }

    // Step 3: Payment
    return (
        <form id="payment-form" onSubmit={handlePaymentSubmit}>
            <PaymentElement id="payment-element" />
            <div className="flex justify-between mt-6">
                <Button variant="outline" type="button" onClick={() => setStep(2)} disabled={isProcessing}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <Button disabled={isProcessing || !stripe || !elements} id="submit">
                    <span id="button-text">
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
                            </>
                        ) : (
                            `Pagar ${formatPrice(item.price)}`
                        )}
                    </span>
                </Button>
            </div>
            {message && <div id="payment-message" className="text-red-500 text-sm mt-2 text-center">{message}</div>}
        </form>
    );
};

// Main wrapper component that fetches client secret
const StripeCheckoutForm = ({ item }: CheckoutFormProps) => {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useAuth(); // Get user from auth context

    useEffect(() => {
        if (item && typeof item.price === 'number') {
            createPaymentIntentAction({ amount: item.price, metadata: { itemId: item.id, itemName: item.name, userId: user?.uid || 'guest' } })
                .then(data => {
                    if (data.error) {
                        setError(data.error);
                        toast({ variant: 'destructive', title: 'Error', description: data.error });
                    } else if (data.clientSecret) {
                        setClientSecret(data.clientSecret);
                    }
                })
                .catch(err => {
                    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                    setError(`Error al preparar el pago: ${errorMessage}`);
                    toast({ variant: 'destructive', title: 'Error', description: `Error al preparar el pago: ${errorMessage}` });
                });
        } else if (item && typeof item.price !== 'number') {
            const errorMessage = `El precio del artículo '${item.name}' no es un número válido.`;
            setError(errorMessage);
            toast({ variant: 'destructive', title: 'Error de Configuración', description: errorMessage });
        }
    }, [item, toast, user]);

    if (!item) return null;

    if (error) {
        return <div className="text-destructive text-center">{error}</div>;
    }

    if (!clientSecret) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const options: StripeElementsOptions = { 
        clientSecret,
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#fcc203', // ShadCN primary color
            }
        }
    };

    return (
        <Elements options={options} stripe={stripePromise}>
            <CheckoutFormWithSteps item={item} />
        </Elements>
    );
};

export default StripeCheckoutForm;
