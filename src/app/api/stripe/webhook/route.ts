
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { setUserSubscriptionPlanAction } from '@/lib/user-actions';
import { FirestoreOrderRepository } from '@/lib/order/infrastructure/persistence/firestore-order.repository';
import { CreateOrderUseCase } from '@/lib/order/application/create-order.use-case';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.firebaseUID;
  const priceId = session.metadata?.priceId;
  const customerDetails = session.customer_details;

  if (session.mode === 'subscription' && session.payment_status === 'paid' && userId && priceId) {
    console.log(`[Stripe Webhook] Subscription checkout session completed for user ${userId} with price ${priceId}.`);
    
    // 1. Update user's plan via custom claims
    const planResult = await setUserSubscriptionPlanAction(userId, priceId);
    if (!planResult.success) {
        console.error(`[Stripe Webhook] Failed to update user plan claim: ${planResult.error}`);
        // Decide on error handling: maybe retry or alert administrators.
    }
    
    // 2. Create an Order record in our database for accounting
    if (customerDetails?.email && session.amount_total !== null) {
        try {
            const orderRepository = new FirestoreOrderRepository();
            const createOrderUseCase = new CreateOrderUseCase(orderRepository);

            // Extract line item description as itemName
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
            const itemName = lineItems.data[0]?.description || 'Suscripción a Valeria';
            
            await createOrderUseCase.execute(
                { // Customer Info
                    userId,
                    email: customerDetails.email,
                    firstName: customerDetails.name?.split(' ')[0] || '',
                    lastName: customerDetails.name?.split(' ').slice(1).join(' ') || '',
                    phone: customerDetails.phone || undefined,
                },
                { // Order Info
                    itemId: priceId,
                    itemName: itemName,
                    amount: session.amount_total / 100, // Amount is in cents
                    currency: session.currency || 'eur',
                    provider: 'stripe',
                    providerPaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : '',
                }
            );
            console.log(`[Stripe Webhook] Successfully created order record for user ${userId}.`);
        } catch (orderError) {
             console.error(`[Stripe Webhook] Failed to create order record for user ${userId}:`, orderError);
        }
    } else {
         console.warn(`[Stripe Webhook] Could not create order record due to missing customer email or amount_total for session ${session.id}.`);
    }
  }
}

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error('Stripe webhook secret is not set.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No stripe-signature header value' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
      break;
    
    // TODO: Handle other subscription events like 'customer.subscription.updated' or 'customer.subscription.deleted'
    // to manage plan changes, cancellations, etc.
    
    default:
      // console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
