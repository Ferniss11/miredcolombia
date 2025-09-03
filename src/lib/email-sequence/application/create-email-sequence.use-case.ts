
// src/lib/email-sequence/application/create-email-sequence.use-case.ts
import type { EmailSequence } from '../domain/email-sequence.entity';
import type { EmailSequenceRepository } from '../domain/email-sequence.repository';

export type CreateEmailSequenceInput = Omit<EmailSequence, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Use case for creating a new email sequence.
 */
export class CreateEmailSequenceUseCase {
  constructor(private readonly repository: EmailSequenceRepository) {}

  async execute(input: CreateEmailSequenceInput): Promise<EmailSequence> {
    const now = new Date();
    const sequenceToCreate: Omit<EmailSequence, 'id'> = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    return this.repository.create(sequenceToCreate);
  }
}
