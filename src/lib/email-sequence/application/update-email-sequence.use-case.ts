// src/lib/email-sequence/application/update-email-sequence.use-case.ts
import type { EmailSequence } from '../domain/email-sequence.entity';
import type { EmailSequenceRepository } from '../domain/email-sequence.repository';

export type UpdateEmailSequenceInput = Partial<Omit<EmailSequence, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Use case for updating an existing email sequence.
 */
export class UpdateEmailSequenceUseCase {
  constructor(private readonly repository: EmailSequenceRepository) {}

  async execute(id: string, data: UpdateEmailSequenceInput): Promise<EmailSequence> {
    const dataToUpdate = {
      ...data,
      updatedAt: new Date(),
    };
    return this.repository.update(id, dataToUpdate);
  }
}
