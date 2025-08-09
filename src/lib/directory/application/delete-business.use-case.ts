// src/lib/directory/application/delete-business.use-case.ts
import type { DirectoryRepository } from '../domain/directory.repository';

/**
 * Use case for deleting a business from the directory.
 */
export class DeleteBusinessUseCase {
  constructor(private readonly directoryRepository: DirectoryRepository) {}

  async execute(id: string): Promise<void> {
    const business = await this.directoryRepository.findById(id);
    if (!business) {
      throw new Error(`Business with ID ${id} not found.`);
    }
    
    // Potentially add more logic here, e.g., check for active subscriptions, notify owner.
    
    await this.directoryRepository.delete(id);
  }
}
