// src/lib/email-sequence/application/get-all-email-sequences.use-case.ts
import type { EmailSequence } from '../domain/email-sequence.entity';
import type { EmailSequenceRepository } from '../domain/email-sequence.repository';

/**
 * Use case for fetching all email sequences.
 */
export class GetAllEmailSequencesUseCase {
  constructor(private readonly repository: EmailSequenceRepository) {}

  async execute(): Promise<EmailSequence[]> {
    return this.repository.findAll();
  }
}
