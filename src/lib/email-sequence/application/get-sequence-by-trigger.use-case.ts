
// src/lib/email-sequence/application/get-sequence-by-trigger.use-case.ts
import type { EmailSequence } from '../domain/email-sequence.entity';
import type { EmailSequenceRepository } from '../domain/email-sequence.repository';

/**
 * Use case for fetching an active email sequence based on a trigger event.
 */
export class GetSequenceByTriggerUseCase {
  constructor(private readonly repository: EmailSequenceRepository) {}

  async execute(trigger: EmailSequence['trigger']): Promise<EmailSequence | null> {
    return this.repository.findActiveByTrigger(trigger);
  }
}
