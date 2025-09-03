
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
  prefilledUser?: { name: string; email: string };
};

const CustomerDetailsSchema = z.object({
    name: z.string().min(2, "El nombre es requerido."),
    email: z.string().email("El email no es válido."),
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
    const [customerDetails, setCustomerDetails] = useState<CustomerDetailsValues | null>(prefilledUser || null);
    const { user } = useAuth();


    const form = useForm<CustomerDetailsValues>({
        resolver: zodResolver(CustomerDetailsSchema),
        defaultValues: { name: prefilledUser?.name || '', email: prefilledUser?.email || '' },
    });
    
    // Automatically trigger payment intent creation if user is already logged in
    useEffect(() => {
        if (prefilledUser && !clientSecret) {
            startTransition(async () => {
                const result = await createOneTimeCheckoutSessionAction({
                    itemId: item.id,
                    itemName: item.name,
                    amount: item.price,
                    userName: prefilledUser.name,
                    userEmail: prefilledUser.email,
                    userId: user?.uid,
                });
                if (result.clientSecret) {
                    setClientSecret(result.clientSecret);
                } else {
                    console.error("Error creating payment intent:", result.error);
                }
            });
        }
    }, [prefilledUser, clientSecret, item, user?.uid]);


    const handleCustomerSubmit = async (values: CustomerDetailsValues) => {
        startTransition(async () => {
            const result = await createOneTimeCheckoutSessionAction({
                itemId: item.id,
                itemName: item.name,
                amount: item.price,
                userName: values.name,
                userEmail: values.email,
                userId: user?.uid, // Will be null for guests, which is fine
            });
            if (result.clientSecret) {
                setCustomerDetails(values);
                setClientSecret(result.clientSecret);
            } else {
                console.error("Error creating payment intent:", result.error);
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
    
    if (prefilledUser) {
        return (
            <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCustomerSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl><Input placeholder="Tu nombre" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="tu@email.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continuar al Pago"}
                </Button>
            </form>
        </Form>
    );
};

export default StripeCheckoutForm;
