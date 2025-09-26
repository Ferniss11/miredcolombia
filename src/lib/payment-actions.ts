
'use server';

import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { CreateOrderUseCase } from './order/application/create-order.use-case';
import { FirestoreOrderRepository } from './order/infrastructure/persistence/firestore-order.repository';


// --- ONE-TIME PAYMENT CHECKOUT ---

const createOneTimeCheckoutSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  amount: z.number().positive(),
  userName: z.string(),
  userEmail: z.string().email(),
  userId: z.string().nullable().optional(),
  phone: z.string().optional(),
  wantsWhatsAppContact: z.boolean().optional(),
  comments: z.string().optional(),
});
type CreateOneTimeCheckoutInput = z.infer<typeof createOneTimeCheckoutSchema>;


export async function createOneTimeCheckoutSessionAction(input: CreateOneTimeCheckoutInput) {
  const validatedInput = createOneTimeCheckoutSchema.parse(input);
  const { itemId, itemName, amount, userName, userEmail, userId, phone, wantsWhatsAppContact, comments } = validatedInput;

  if (!stripe) {
    throw new Error('Stripe is not configured.');
  }
   const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is not set in environment variables.');
    }

  try {
    const orderRepository = new FirestoreOrderRepository();
    const createOrderUseCase = new CreateOrderUseCase(orderRepository);

    // Create a 'pending' order in our database first
    const pendingOrder = await createOrderUseCase.execute(
      { // Customer Info
        userId,
        firstName: userName.split(' ')[0],
        lastName: userName.split(' ').slice(1).join(' '),
        email: userEmail,
        phone,
        wantsWhatsAppContact,
        comments
      },
      { // Order Details
        itemId,
        itemName,
        amount,
        currency: 'eur',
        provider: 'stripe',
      }
    );

    // Create a Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects the amount in cents
      currency: 'eur',
      metadata: { 
        orderId: pendingOrder.id, // Link our internal order ID to the Stripe transaction
        userId: userId || 'guest',
        customerEmail: userEmail,
       },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Failed to create Stripe Payment Intent.");
    }

    return { clientSecret: paymentIntent.client_secret };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Error creating one-time checkout session:', errorMessage);
    return { error: `No se pudo crear la sesión de pago: ${errorMessage}` };
  }
}


// --- SUBSCRIPTION CHECKOUT ---

const createSubscriptionCheckoutSchema = z.object({
  planId: z.string(),
  userId: z.string(),
  userEmail: z.string(),
});

type CreateSubscriptionCheckoutInput = z.infer<typeof createSubscriptionCheckoutSchema>;

export async function createSubscriptionCheckoutSessionAction(input: CreateSubscriptionCheckoutInput) {
  try {
    const validatedInput = createSubscriptionCheckoutSchema.parse(input);
    const { planId, userId, userEmail } = validatedInput;

    if (!stripe) { throw new Error('Stripe no está configurado.'); }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) { throw new Error('NEXT_PUBLIC_APP_URL no está configurado.'); }

    let customerId: string;
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length > 0 && customers.data[0].id) {
        customerId = customers.data[0].id;
    } else {
        const newCustomer = await stripe.customers.create({ email: userEmail, metadata: { firebaseUID: userId } });
        customerId = newCustomer.id;
    }

    let checkoutOptions: Stripe.Checkout.SessionCreateParams;

    if (planId === 'valeria_premium') { // Monthly Recurring Subscription
        const stripePriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_VALERIA_PREMIUM;
        if (!stripePriceId) throw new Error("Stripe Price ID para el plan mensual no está configurado.");
        checkoutOptions = {
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{ price: stripePriceId, quantity: 1 }],
            metadata: { firebaseUID: userId, planId },
            success_url: `${appUrl}/valeria/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/valeria?payment=cancelled`,
        };
    } else if (planId === 'valeria_premium_quarterly') { // One-time payment for 3 months
        const stripePriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_VALERIA_PREMIUM_PROMO;
        if (!stripePriceId) throw new Error("Stripe Price ID para la promoción trimestral no está configurado.");
         checkoutOptions = {
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'payment', // Important: This is a one-time payment, not a subscription
            line_items: [{ price: stripePriceId, quantity: 1 }],
            payment_intent_data: { // We need to capture payment intent data for the webhook
                metadata: { firebaseUID: userId, planId },
            },
            success_url: `${appUrl}/valeria/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/valeria?payment=cancelled`,
        };
    } else {
        throw new Error(`Plan ID desconocido: ${planId}`);
    }

    const session = await stripe.checkout.sessions.create(checkoutOptions);
    
    if (!session.url) {
        throw new Error("Stripe no devolvió una URL de pago.");
    }
    
    return { checkoutUrl: session.url };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
    console.error('Error creando la sesión de pago:', errorMessage);
    return { error: `No se pudo crear la sesión de pago: ${errorMessage}` };
  }
}
