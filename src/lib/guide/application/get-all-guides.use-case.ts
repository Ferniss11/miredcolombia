// src/lib/guide/application/get-all-guides.use-case.ts
import type { Guide } from '../domain/guide.entity';
import type { GuideRepository } from '../domain/guide.repository';

/**
 * Use case for fetching all guides.
 */
export class GetAllGuidesUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(): Promise<Guide[]> {
    return this.repository.findAll();
  }
}
