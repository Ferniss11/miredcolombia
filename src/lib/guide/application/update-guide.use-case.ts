// src/lib/guide/application/update-guide.use-case.ts
import type { Guide } from '../domain/guide.entity';
import type { GuideRepository } from '../domain/guide.repository';

export type UpdateGuideInput = Partial<Omit<Guide, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Use case for updating an existing guide.
 */
export class UpdateGuideUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(id: string, data: UpdateGuideInput): Promise<Guide> {
    const dataToUpdate = {
      ...data,
      updatedAt: new Date(),
    };
    return this.repository.update(id, dataToUpdate);
  }
}
