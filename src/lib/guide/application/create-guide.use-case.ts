// src/lib/guide/application/create-guide.use-case.ts
import type { Guide } from '../domain/guide.entity';
import type { GuideRepository } from '../domain/guide.repository';

export type CreateGuideInput = Omit<Guide, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Use case for creating a new guide.
 */
export class CreateGuideUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(input: CreateGuideInput): Promise<Guide> {
    const now = new Date();
    const guideToCreate: Omit<Guide, 'id'> = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    return this.repository.create(guideToCreate);
  }
}
