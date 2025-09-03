
'use server';

import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { CreateOrderUseCase } from './order/application/create-order.use-case';
import { FirestoreOrderRepository } from './order/infrastructure/persistence/firestore-order.repository';

const createSubscriptionCheckoutSchema = z.object({
  priceId: z.string(),
  userId: z.string(),
  userEmail: z.string(),
});

type CreateSubscriptionCheckoutInput = z.infer<typeof createSubscriptionCheckoutSchema>;

const createOneTimeCheckoutSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  amount: z.number().positive(),
  userName: z.string(),
  userEmail: z.string(),
  userId: z.string().optional(), // UserId is now optional for guest checkouts
});

type CreateOneTimeCheckoutInput = z.infer<typeof createOneTimeCheckoutSchema>;


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
      success_url: `${appUrl}/valeria/payment-success`,
      cancel_url: `${appUrl}/valeria?payment=cancelled`,
    });
    
    return { sessionId: session.id };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Error creating checkout session:', errorMessage);
    return { error: `No se pudo crear la sesión de pago: ${errorMessage}` };
  }
}


export async function createOneTimeCheckoutSessionAction(input: CreateOneTimeCheckoutInput) {
  try {
      const validatedInput = createOneTimeCheckoutSchema.parse(input);
      const { itemId, itemName, amount, userName, userEmail, userId } = validatedInput;

      if (!stripe) throw new Error('Stripe no está configurado.');

      // 1. Create Order in our DB with 'pending' status
      const orderRepository = new FirestoreOrderRepository();
      const createOrderUseCase = new CreateOrderUseCase(orderRepository);
      
      const [firstName, ...lastNameParts] = userName.split(' ');
      const lastName = lastNameParts.join(' ');

      const order = await createOrderUseCase.execute(
          { userId: userId || null, email: userEmail, firstName, lastName },
          {
              itemId,
              itemName,
              amount,
              currency: 'eur',
              provider: 'stripe',
          }
      );

      // 2. Create Stripe Customer if not exists
      let customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      let customerId: string;
      if (customers.data.length > 0 && customers.data[0].id) {
          customerId = customers.data[0].id;
      } else {
          const newCustomer = await stripe.customers.create({ name: userName, email: userEmail, metadata: { firebaseUID: userId || '' } });
          customerId = newCustomer.id;
      }

      // 3. Create Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Amount in cents
          currency: 'eur',
          customer: customerId,
          metadata: {
              orderId: order.id, // Link PaymentIntent to our Order
              firebaseUID: userId || '',
          },
      });

      return { clientSecret: paymentIntent.client_secret };

  } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('Error creating one-time payment intent:', errorMessage);
      return { error: `No se pudo iniciar el pago: ${errorMessage}` };
  }
}
