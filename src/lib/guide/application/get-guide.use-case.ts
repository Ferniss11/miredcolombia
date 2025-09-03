// src/lib/guide/application/get-guide.use-case.ts
import type { Guide } from '../domain/guide.entity';
import type { GuideRepository } from '../domain/guide.repository';

/**
 * Use case for fetching a single guide by its ID.
 */
export class GetGuideUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(id: string): Promise<Guide | null> {
    return this.repository.findById(id);
  }
}
