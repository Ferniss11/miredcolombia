
'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin-config';

// Schema for validating the incoming data
const QuoteRequestSchema = z.object({
  packageName: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  travelDate: z.string().optional(),
  adults: z.number().int().min(1),
  children: z.number().int().min(0),
  servicesNeeded: z.array(z.string()).optional(),
  message: z.string().optional(),
});

type QuoteRequestInput = z.infer<typeof QuoteRequestSchema>;

export async function saveQuoteRequestAction(data: QuoteRequestInput) {
  try {
    const validatedData = QuoteRequestSchema.parse(data);

    if (!adminDb) {
      throw new Error('Firebase Admin SDK is not initialized.');
    }
    
    // Create a new document in the 'packRequests' collection
    await adminDb.collection('packRequests').add({
      ...validatedData,
      status: 'new', // Default status for a new request
      createdAt: new Date(),
    });
    
    // In a real application, you might also trigger an email notification to the admin team here.
    
    return { success: true };
  } catch (error) {
    console.error("Error saving quote request:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
