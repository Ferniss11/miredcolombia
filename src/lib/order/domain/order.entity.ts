// src/lib/order/domain/order.entity.ts

/**
 * Represents a customer who makes a purchase. Can be a guest or a registered user.
 */
export interface Customer {
  id: string; // Firestore document ID
  userId?: string | null; // Link to auth user if they are registered
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: Date;
}

/**
 * Represents a single transaction or purchase on the platform.
 * It's flexible enough for subscriptions or one-time payments.
 */
export interface Order {
  id: string; // Firestore document ID
  customerId: string; // Link to the Customer entity
  userId?: string | null; // Link to auth user if they placed the order
  
  // Order Details
  itemId: string; // The ID of the product/plan purchased (e.g., plan_colombia or a product ID)
  itemName: string; // The name of the product/plan (e.g., "Plan Colombia")
  amount: number; // The total amount paid
  currency: string; // e.g., 'eur'
  
  // Status and Timestamps
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  createdAt: Date;
  
  // Payment Provider Details
  provider: 'stripe'; // To allow for other providers in the future
  providerPaymentId: string; // The ID from the payment provider (e.g., Stripe Payment Intent ID)
}
