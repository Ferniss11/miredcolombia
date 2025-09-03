
// src/lib/email-sequence/domain/email-sequence.entity.ts
import { z } from 'zod';

/**
 * Represents a single step in an email sequence.
 */
export const EmailStepSchema = z.object({
  id: z.string(), // Unique ID for the step within the sequence
  delayMinutes: z.coerce.number().min(0), // Delay in minutes after the previous step (or trigger)
  subject: z.string(),
  body: z.string(), // HTML or Markdown content for the email
  templateId: z.string().optional(), // Optional ID for a template in a service like SendGrid
});
export type EmailStep = z.infer<typeof EmailStepSchema>;


/**
 * Defines the trigger events that can start an email sequence.
 */
export type SequenceTrigger = 'on_guide_download' | 'on_user_signup' | 'on_service_purchase';


/**
 * Represents an automated sequence of emails.
 */
export interface EmailSequence {
  id: string; // Firestore document ID
  name: string; // e.g., "Bienvenida Guía Empadronamiento"
  trigger: SequenceTrigger;
  steps: EmailStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
