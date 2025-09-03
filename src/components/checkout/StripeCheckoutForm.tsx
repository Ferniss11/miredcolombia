
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createOneTimeCheckoutSessionAction } from '@/lib/payment-actions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type ItemProp = {
    id: string;
    name: string;
    price: number;
    type: 'package' | 'service' | 'plan'; 
};
type CheckoutFormWrapperProps = {
  item: ItemProp;
  prefilledUser?: { name: string; email: string, phone?: string };
};

const CustomerDetailsSchema = z.object({
    name: z.string().min(2, "El nombre es requerido."),
    email: z.string().email("El email no es válido."),
    phone: z.string().optional(),
    wantsWhatsAppContact: z.boolean().default(false),
    comments: z.string().optional(),
    acceptTerms: z.boolean().refine((val) => val === true, { message: "Debes aceptar los términos y condiciones." }),
});
type CustomerDetailsValues = z.infer<typeof CustomerDetailsSchema>;

const CheckoutForm = ({ item, customerDetails }: { item: ItemProp, customerDetails: CustomerDetailsValues }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) {
            setMessage('El formulario de pago no está listo.');
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/valeria/payment-success`,
                    receipt_email: customerDetails.email,
                },
            });
            
            if (error.type === "card_error" || error.type === "validation_error") {
                setMessage(error.message || 'Error de validación desconocido.');
            } else if (error) {
                setMessage("Ha ocurrido un error inesperado.");
            }

        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
             setMessage(errorMessage);
             toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" />
            <Button disabled={isProcessing || !stripe || !elements} id="submit" className="w-full mt-6">
                <span id="button-text">
                    {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        `Pagar ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price)}`
                    )}
                </span>
            </Button>
            {message && <div id="payment-message" className="text-red-500 text-sm mt-2 text-center">{message}</div>}
        </form>
    );
};

// Wrapper component for the entire checkout flow
const StripeCheckoutForm = ({ item, prefilledUser }: CheckoutFormWrapperProps) => {
    const [isPending, startTransition] = useTransition();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [customerDetails, setCustomerDetails] = useState<CustomerDetailsValues | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const form = useForm<CustomerDetailsValues>({
        resolver: zodResolver(CustomerDetailsSchema),
        defaultValues: { 
            name: prefilledUser?.name || '', 
            email: prefilledUser?.email || '',
            phone: prefilledUser?.phone || '',
            wantsWhatsAppContact: true,
            comments: '',
            acceptTerms: false,
        },
    });
    
    useEffect(() => {
        if (prefilledUser) {
            form.reset({
                name: prefilledUser.name,
                email: prefilledUser.email,
                phone: prefilledUser.phone || '',
                wantsWhatsAppContact: true,
                comments: '',
                acceptTerms: false,
            });
        }
    }, [prefilledUser, form]);

    const handleCustomerSubmit = async (values: CustomerDetailsValues) => {
        startTransition(async () => {
            const result = await createOneTimeCheckoutSessionAction({
                itemId: item.id,
                itemName: item.name,
                amount: item.price,
                userName: values.name,
                userEmail: values.email,
                userId: user?.uid, // Will be null for guests, which is fine
                phone: values.phone,
                wantsWhatsAppContact: values.wantsWhatsAppContact,
                comments: values.comments
            });
            if (result.clientSecret) {
                setCustomerDetails(values);
                setClientSecret(result.clientSecret);
            } else {
                console.error("Error creating payment intent:", result.error);
                 toast({ variant: 'destructive', title: 'Error de Pago', description: result.error });
            }
        });
    };
    
    if (clientSecret && customerDetails) {
        const options: StripeElementsOptions = {
            clientSecret,
            appearance: { theme: 'stripe' },
        };
        return (
            <Elements options={options} stripe={stripePromise}>
                <CheckoutForm item={item} customerDetails={customerDetails} />
            </Elements>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCustomerSubmit)} className="space-y-4">
                 <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="Tu nombre y apellidos" {...field} disabled={!!prefilledUser || isPending} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} disabled={!!prefilledUser || isPending} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="+34 600 000 000" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="wantsWhatsAppContact" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Acepto contacto por WhatsApp</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="comments" render={({ field }) => (<FormItem><FormLabel>Comentarios (Opcional)</FormLabel><FormControl><Textarea placeholder="¿Hay algo más que debamos saber?" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="acceptTerms" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Acepto los <Link href="/legal/terminos" className="text-primary hover:underline">términos y condiciones</Link>.</FormLabel><FormMessage /></div></FormItem>)} />
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continuar al Pago"}
                </Button>
            </form>
        </Form>
    );
};

export default StripeCheckoutForm;
