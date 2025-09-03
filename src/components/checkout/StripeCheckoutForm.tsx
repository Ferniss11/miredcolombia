
'use client';

import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type ItemProp = {
    id: string;
    name: string;
    price: number;
    type: 'package' | 'service';
};
type CheckoutFormProps = {
  item: ItemProp;
};

// The core payment form component, now using Payment Intents
const CheckoutForm = ({ item }: CheckoutFormProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements || !user) {
            setMessage('El formulario de pago no está listo o no has iniciado sesión.');
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/valeria/payment-success`, // Re-use the success page for now
                },
            });

            if (error.type === "card_error" || error.type === "validation_error") {
                setMessage(error.message || 'Error de validación desconocido.');
            } else {
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

// Wrapper component that creates the PaymentIntent and provides Stripe context
const StripeCheckoutForm = ({ item }: CheckoutFormProps) => {
    const { user } = useAuth();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user && item) {
            createOneTimeCheckoutSessionAction({
                itemId: item.id,
                itemName: item.name,
                amount: item.price,
                userId: user.uid,
                userEmail: user.email!,
            }).then(result => {
                if (result.clientSecret) {
                    setClientSecret(result.clientSecret);
                } else if (result.error) {
                    console.error("Error creating payment intent:", result.error);
                }
                setIsLoading(false);
            });
        }
    }, [user, item]);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!clientSecret) {
        return <div>Error al cargar el formulario de pago. Por favor, refresca la página.</div>
    }
    
    const options: StripeElementsOptions = {
        clientSecret,
        appearance: { theme: 'stripe' },
    };

    return (
        <Elements options={options} stripe={stripePromise}>
            <CheckoutForm item={item} />
        </Elements>
    );
};

export default StripeCheckoutForm;
