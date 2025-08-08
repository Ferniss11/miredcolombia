// src/lib/directory/domain/directory.repository.ts
import type { Business } from './business.entity';

/**
 * Defines the contract (port) for interacting with the directory data persistence layer.
 * This allows the application layer to be independent of the database implementation.
 */
export interface DirectoryRepository {
  /**
   * Saves a business entity to the persistence layer.
   * Can be used for both creation and updates.
   * @param business - The business entity to save.
   * @returns A promise that resolves when the operation is complete.
   */
  save(business: Business): Promise<void>;

  /**
   * Finds a business by its unique identifier (Place ID).
   * @param id - The Place ID of the business.
   * @returns The Business entity or null if not found.
   */
  findById(id: string): Promise<Business | null>;

  /**
   * Retrieves all businesses from the directory.
   * Can be filtered, e.g., to only return approved businesses.
   * @param onlyApproved - If true, returns only businesses with 'approved' status.
   * @returns An array of Business entities.
   */
  findAll(onlyApproved?: boolean): Promise<Business[]>;

  /**
   * Deletes a business from the directory.
   * @param id - The Place ID of the business to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  delete(id: string): Promise<void>;

  /**
   * Updates specific fields of a business entity.
   * @param id - The Place ID of the business to update.
   * @param data - An object containing the fields to update.
   * @returns The updated Business entity.
   */
  update(id: string, data: Partial<Business>): Promise<Business>;
}
