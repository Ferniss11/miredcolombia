
// src/lib/email-sequence/domain/email-sequence.repository.ts
import type { EmailSequence } from './email-sequence.entity';

/**
 * Defines the contract (port) for interacting with the email sequence data persistence layer.
 */
export interface EmailSequenceRepository {
  /**
   * Creates a new email sequence.
   * @param sequenceData - The data for the new sequence.
   * @returns The created EmailSequence entity.
   */
  create(sequenceData: Omit<EmailSequence, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailSequence>;

  /**
   * Finds a sequence by its unique ID.
   * @param id - The ID of the sequence.
   * @returns The EmailSequence entity or null if not found.
   */
  findById(id: string): Promise<EmailSequence | null>;
  
  /**
   * Finds the first active sequence associated with a specific trigger event.
   * @param trigger - The trigger event (e.g., 'on_guide_download').
   * @returns The active EmailSequence entity or null if no active sequence is found for that trigger.
   */
  findActiveByTrigger(trigger: EmailSequence['trigger']): Promise<EmailSequence | null>;

  /**
   * Retrieves all email sequences.
   * @returns An array of all EmailSequence entities.
   */
  findAll(): Promise<EmailSequence[]>;

  /**
   * Updates an existing email sequence.
   * @param id - The ID of the sequence to update.
   * @param data - The data to update.
   * @returns The updated EmailSequence entity.
   */
  update(id: string, data: Partial<EmailSequence>): Promise<EmailSequence>;

  /**
   * Deletes an email sequence.
   * @param id - The ID of the sequence to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  delete(id: string): Promise<void>;
}
