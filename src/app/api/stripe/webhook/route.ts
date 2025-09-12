
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { FirestoreOrderRepository } from '@/lib/order/infrastructure/persistence/firestore-order.repository';
import { CreateOrderUseCase } from '@/lib/order/application/create-order.use-case';
import { SetUserSubscriptionPlanUseCase } from '@/lib/user/application/set-user-subscription-plan.use-case';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';


const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// --- Webhook Handlers ---

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // This handler is now specifically for SUBSCRIPTIONS created via Stripe's hosted Checkout page.
  if (session.mode !== 'subscription') return;

  const userId = session.metadata?.firebaseUID;
  const planId = session.metadata?.planId; // We now receive our internal planId
  const customerDetails = session.customer_details;

  if (session.payment_status === 'paid' && userId && planId) {
    console.log(`[Stripe Webhook] Subscription checkout session completed for user ${userId} with plan ${planId}.`);
    
    // 1. Update user's plan via the Use Case
    const userRepository = new FirestoreUserRepository();
    const setPlanUseCase = new SetUserSubscriptionPlanUseCase(userRepository);
    await setPlanUseCase.execute({ userId, planId });
    
    // 2. Create a "succeeded" Order record for accounting
    if (customerDetails?.email && session.amount_total !== null) {
      try {
        const orderRepository = new FirestoreOrderRepository();
        const createOrderUseCase = new CreateOrderUseCase(orderRepository);
        const lineItems = await stripe!.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const itemName = lineItems.data[0]?.description || 'Suscripción a Valeria';
        
        await createOrderUseCase.execute(
          {
            userId,
            email: customerDetails.email,
            firstName: customerDetails.name?.split(' ')[0] || '',
            lastName: customerDetails.name?.split(' ').slice(1).join(' ') || '',
          },
          {
            itemId: planId, // Use our internal planId for the order record
            itemName: itemName,
            amount: session.amount_total / 100, // Amount is in cents
            currency: session.currency || 'eur',
            provider: 'stripe',
            providerPaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : '',
          }
        );
        console.log(`[Stripe Webhook] Successfully created order record for subscription for user ${userId}.`);
      } catch (orderError) {
        console.error(`[Stripe Webhook] Failed to create order record for subscription for user ${userId}:`, orderError);
      }
    } else {
      console.warn(`[Stripe Webhook] Could not create order record due to missing data for session ${session.id}.`);
    }
  }
}


// --- Main Webhook Route ---

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error('Stripe webhook secret is not set.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }
  
  if (!stripe) {
      console.error('Stripe is not initialized. Check STRIPE_SECRET_KEY.');
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
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
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      // case 'payment_intent.succeeded': // We can add other handlers later if needed
      //   break;
      
      default:
        // console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
    }
  } catch(e) {
     console.error(`[Stripe Webhook] Error handling event ${event.type}:`, e);
     return NextResponse.json({ error: `Webhook handler failed: ${(e as Error).message}` }, { status: 500 });
  }


  return NextResponse.json({ received: true });
}
