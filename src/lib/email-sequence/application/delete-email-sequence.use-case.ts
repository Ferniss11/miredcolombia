// src/lib/email-sequence/application/delete-email-sequence.use-case.ts
import type { EmailSequenceRepository } from '../domain/email-sequence.repository';

/**
 * Use case for deleting an email sequence.
 */
export class DeleteEmailSequenceUseCase {
  constructor(private readonly repository: EmailSequenceRepository) {}

  async execute(id: string): Promise<void> {
    // In a real app, you might want to add logic to unschedule pending emails first.
    return this.repository.delete(id);
  }
}
