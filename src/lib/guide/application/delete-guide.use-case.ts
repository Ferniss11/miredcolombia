// src/lib/guide/application/delete-guide.use-case.ts
import type { GuideRepository } from '../domain/guide.repository';

/**
 * Use case for deleting a guide.
 */
export class DeleteGuideUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(id: string): Promise<void> {
    // Here you could add logic to also delete files from Firebase Storage.
    // For now, it just deletes the database record.
    return this.repository.delete(id);
  }
}
