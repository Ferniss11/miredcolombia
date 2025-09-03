
// src/lib/email-sequence/domain/email-automation.service.ts
import { adminDb } from '@/lib/firebase/admin-config';
import type { Customer, Order } from '@/lib/order/domain/order.entity';
import type { EmailSequence } from './email-sequence.entity';

const MAIL_COLLECTION = 'mail';

/**
 * A domain service responsible for handling email scheduling logic.
 */
export class EmailAutomationService {
    private getDb() {
        if (!adminDb) throw new Error('Firestore not initialized for EmailAutomationService.');
        return adminDb;
    }
    
    /**
     * Schedules all emails in a sequence to be sent to a customer.
     * This method creates documents in the 'mail' collection that the "Trigger Email" Firebase Extension listens to.
     * @param sequence - The email sequence to schedule.
     * @param customer - The customer who will receive the emails.
     * @param order - The order that triggered the sequence.
     */
    async scheduleSequence(sequence: EmailSequence, customer: Customer, order: Order): Promise<void> {
        const db = this.getDb();
        const batch = db.batch();

        for (const step of sequence.steps) {
            const mailDocRef = db.collection(MAIL_COLLECTION).doc();
            
            // Calculate the delivery time by adding the delay to the current time
            const deliveryTime = new Date();
            deliveryTime.setMinutes(deliveryTime.getMinutes() + step.delayMinutes);

            // Replace placeholders in the email body
            const personalizedBody = step.body
                .replace(/{{firstName}}/g, customer.firstName)
                .replace(/{{itemName}}/g, order.itemName);

            // The document structure required by the "Trigger Email" extension
            const mailDocument = {
                to: [customer.email],
                delivery: {
                    startTime: deliveryTime, // The scheduled time for the email to be sent
                    state: 'PENDING',
                },
                message: {
                    subject: step.subject,
                    html: personalizedBody, // Assuming body is HTML
                },
                // Add our own metadata for tracking
                metadata: {
                    orderId: order.id,
                    customerId: customer.id,
                    sequenceId: sequence.id,
                    stepId: step.id,
                }
            };
            batch.set(mailDocRef, mailDocument);
        }

        await batch.commit();
        console.log(`[EmailAutomationService] Scheduled ${sequence.steps.length} emails for sequence "${sequence.name}" for customer ${customer.email}.`);
    }
}
