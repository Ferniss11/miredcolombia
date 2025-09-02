// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { setUserSubscriptionPlanAction } from '@/lib/user-actions';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

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
      
      const userId = session.metadata?.firebaseUID;
      const priceId = session.metadata?.priceId;
      
      if (session.mode === 'subscription' && session.payment_status === 'paid' && userId && priceId) {
        console.log(`[Stripe Webhook] Checkout session completed for user ${userId} with price ${priceId}.`);
        
        const result = await setUserSubscriptionPlanAction(userId, priceId);
        if (!result.success) {
            console.error(`[Stripe Webhook] Failed to update user plan: ${result.error}`);
            // You might want to add retry logic or alert administrators here
        }
      }
      break;
    
    // TODO: Handle other subscription events like 'customer.subscription.updated' or 'customer.subscription.deleted'
    // to manage plan changes, cancellations, etc.
    
    default:
      console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
