// src/lib/email-sequence/application/get-email-sequence.use-case.ts
import type { EmailSequence } from '../domain/email-sequence.entity';
import type { EmailSequenceRepository } from '../domain/email-sequence.repository';

/**
 * Use case for fetching a single email sequence by its ID.
 */
export class GetEmailSequenceUseCase {
  constructor(private readonly repository: EmailSequenceRepository) {}

  async execute(id: string): Promise<EmailSequence | null> {
    return this.repository.findById(id);
  }
}
