
'use server';

import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { CreateOrderUseCase } from './order/application/create-order.use-case';
import { FirestoreOrderRepository } from './order/infrastructure/persistence/firestore-order.repository';

// --- SUBSCRIPTION CHECKOUT ---

const createSubscriptionCheckoutSchema = z.object({
  priceId: z.string(),
  userId: z.string(),
  userEmail: z.string(),
});

type CreateSubscriptionCheckoutInput = z.infer<typeof createSubscriptionCheckoutSchema>;


export async function createSubscriptionCheckoutSessionAction(input: CreateSubscriptionCheckoutInput) {
  try {
    const validatedInput = createSubscriptionCheckoutSchema.parse(input);
    const { priceId, userId, userEmail } = validatedInput;

    if (!stripe) {
      throw new Error('Stripe is not configured.');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is not set in environment variables.');
    }

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0 && customers.data[0].id) {
        customerId = customers.data[0].id;
    } else {
        const newCustomer = await stripe.customers.create({
            email: userEmail,
            metadata: { firebaseUID: userId },
        });
        customerId = newCustomer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        firebaseUID: userId,
        priceId: priceId,
      },
      // The success_url now correctly points to the page that handles token refresh
      success_url: `${appUrl}/valeria/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/valeria?payment=cancelled`,
    });
    
    // The key change: return the full URL for redirection.
    if (!session.url) {
        throw new Error("Stripe did not return a checkout URL.");
    }
    
    return { checkoutUrl: session.url };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Error creating checkout session:', errorMessage);
    return { error: `No se pudo crear la sesión de pago: ${errorMessage}` };
  }
}
