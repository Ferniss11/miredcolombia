'use client';

import React, { useState } from 'react';
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
import { createSubscriptionCheckoutSessionAction } from '@/lib/payment-actions';
import { useAuth } from '@/context/AuthContext';
import type { ValeriaPlan } from '@/lib/types';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type ItemProp = ValeriaPlan & { type: 'plan' };
type CheckoutFormProps = {
  item: ItemProp;
};

// The core payment form component
const CheckoutForm = ({ item }: CheckoutFormProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const { user, userProfile } = useAuth();
    const { toast } = useToast();

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
            // We are now creating a subscription checkout session
            const { sessionId, error } = await createSubscriptionCheckoutSessionAction({
                priceId: item.id, // The item ID is now the Stripe Price ID
                userId: user.uid,
                userEmail: user.email || 'No email',
            });

            if (error || !sessionId) {
                throw new Error(error || 'No se pudo crear la sesión de checkout.');
            }
            
            // Redirect to Stripe's hosted checkout page
            const { error: stripeError } = await stripe.redirectToCheckout({
                sessionId,
            });

            if (stripeError) {
                throw stripeError;
            }

        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
             setMessage(errorMessage);
             toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsProcessing(false);
        }
    };

     const formatPrice = (price: number | string) => {
        const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.,]/g, '').replace(',', '.')) : price;
        if (isNaN(numericPrice)) return 'Precio no disponible';
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(numericPrice);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            {/* The PaymentElement is no longer needed here as we use Stripe's hosted checkout page */}
            <Button disabled={isProcessing || !stripe || !elements} id="submit" className="w-full">
                <span id="button-text">
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirigiendo a pago...
                        </>
                    ) : (
                        `Pagar ${formatPrice(item.price)}`
                    )}
                </span>
            </Button>
            {message && <div id="payment-message" className="text-red-500 text-sm mt-2 text-center">{message}</div>}
        </form>
    );
};

// Wrapper component that provides the Stripe context
const StripeCheckoutForm = ({ item }: CheckoutFormProps) => {
    if (!item) return null;

    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm item={item} />
        </Elements>
    );
};

export default StripeCheckoutForm;
