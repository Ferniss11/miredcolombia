// src/lib/real-estate/domain/property.repository.ts
import type { Property } from './property.entity';

/**
 * Defines the contract (port) for interacting with the real estate data persistence layer.
 */
export interface PropertyRepository {
  /**
   * Creates a new property listing in the database.
   * @param property - The property entity to create (without an id).
   * @returns The created property entity, including its new ID.
   */
  create(property: Omit<Property, 'id'>): Promise<Property>;

  /**
   * Finds a property by its unique identifier.
   * @param id - The ID of the property.
   * @returns The Property entity or null if not found.
   */
  findById(id: string): Promise<Property | null>;

  /**
   * Retrieves all properties, with an option to filter by status.
   * @param status - Optional status to filter by (e.g., 'available').
   * @returns An array of Property entities.
   */
  findAll(status?: Property['status']): Promise<Property[]>;

  /**
   * Updates an existing property listing.
   * @param id - The ID of the property to update.
   * @param data - An object containing the fields to update.
   * @returns The updated Property entity.
   */
  update(id: string, data: Partial<Omit<Property, 'id' | 'createdAt'>>): Promise<Property>;

  /**
   * Deletes a property listing from the database.
   * @param id - The ID of the property to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  delete(id: string): Promise<void>;
}
