'use server';

import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { createOrder } from '@/services/order.service';
import { getOrCreateCustomer } from '@/services/customer.service';

const paymentIntentSchema = z.object({
  amount: z.number().positive(),
  metadata: z.record(z.string()).optional(),
});

export async function createPaymentIntentAction(
  input: z.infer<typeof paymentIntentSchema>
) {
  try {
    if (!stripe) {
      throw new Error(
        'Stripe is not configured. Please provide a STRIPE_SECRET_KEY in your .env file.'
      );
    }
    const { amount, metadata } = paymentIntentSchema.parse(input);

    // Stripe expects the amount in the smallest currency unit (e.g., cents)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });

    return { clientSecret: paymentIntent.client_secret, error: null };
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      clientSecret: null,
      error: `No se pudo iniciar el pago: ${errorMessage}`,
    };
  }
}

const orderActionSchema = z.object({
  userId: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  wantsWhatsAppContact: z.boolean(),
  comments: z.string().optional(),
  itemId: z.string(),
  itemName: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'succeeded', 'failed']),
  stripePaymentIntentId: z.string(),
});

export async function createOrderAction(
  input: z.infer<typeof orderActionSchema>
) {
  try {
    const validatedData = orderActionSchema.parse(input);

    const {
      userId,
      firstName,
      lastName,
      email,
      phone,
      wantsWhatsAppContact,
      comments,
      ...orderData
    } = validatedData;

    const customerId = await getOrCreateCustomer({
      userId,
      firstName,
      lastName,
      email,
      phone,
      wantsWhatsAppContact,
      comments,
    });

    const orderId = await createOrder({
      ...orderData,
      userId,
      customerId,
    });

    return { success: true, orderId };
  } catch (error) {
    console.error('Error creating order:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      error: `No se pudo guardar el pedido: ${errorMessage}`,
    };
  }
}
