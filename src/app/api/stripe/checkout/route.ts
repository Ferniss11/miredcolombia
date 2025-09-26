
// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { cookies } from 'next/headers';

/**
 * This server-side route handles redirecting the user to Stripe's hosted checkout page.
 * It's a layer of security and control between our client-side and Stripe.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const sessionCookie = cookies().get('session')?.value;

  if (!sessionId) {
    return NextResponse.redirect(new URL('/valeria?error=session_missing', req.url));
  }
  
  // Basic check to ensure a user is logged in before redirecting.
  // A more robust check could verify the session cookie against Firebase Auth.
  if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login?redirect=/valeria', req.url));
  }

  try {
    if (!stripe) {
        throw new Error('Stripe is not initialized.');
    }
    // We don't need to 'get' the session from Stripe here.
    // The sessionId is enough to redirect. The browser will handle the rest.
    const { url } = await stripe.checkout.sessions.retrieve(sessionId);

    if (url) {
      return NextResponse.redirect(url);
    } else {
      // This case should theoretically not happen if the session ID is valid.
      return NextResponse.redirect(new URL('/valeria?error=checkout_url_missing', req.url));
    }

  } catch (error) {
    console.error(`Error redirecting to Stripe Checkout:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Redirect back to the pricing page with an error message
    return NextResponse.redirect(new URL(`/valeria?error=${encodeURIComponent(errorMessage)}`, req.url));
  }
}
