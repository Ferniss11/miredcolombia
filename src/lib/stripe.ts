import Stripe from 'stripe';

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
    typescript: true,
  });
} else {
  console.warn(
    'STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.'
  );
}

export { stripe };
