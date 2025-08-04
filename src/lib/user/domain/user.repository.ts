// Defines the port for user data persistence.
// This interface dictates how the application layer interacts with the user database,
// regardless of the underlying technology (e.g., Firestore, SQL).

import type { User } from './user.entity';

export interface UserRepository {
  /**
   * Creates a new user record in the database.
   * This method is used after a user has been successfully authenticated by an AuthRepository.
   * @param user - The complete user entity to create.
   * @returns The created user entity, possibly with a database-generated ID.
   */
  create(user: User): Promise<User>;

  /**
   * Finds a user by their unique identifier (UID).
   * @param uid - The user's unique identifier.
   * @returns The user entity or null if not found.
   */
  findByUid(uid: string): Promise<User | null>;
  
  /**
   * Retrieves all users from the database.
   * @returns A promise that resolves to an array of User entities.
   */
  findAll(): Promise<User[]>;

  /**
   * Updates an existing user's data.
   * @param uid - The UID of the user to update.
   * @param data - An object containing the fields to update.
   * @returns The updated user entity.
   */
  update(uid: string, data: Partial<User>): Promise<User>;
  
  /**
   * Performs a soft delete on a user by changing their status.
   * @param uid - The UID of the user to soft delete.
   * @returns A promise that resolves when the operation is complete.
   */
  softDelete(uid: string): Promise<void>;

  /**
   * Finds a user's public profile information by their UID.
   * This is intended to return a safe subset of data for public display.
   * @param uid - The user's unique identifier.
   * @returns A partial user entity with only public fields, or null if not found.
   */
  findPublicProfileByUid(uid: string): Promise<Partial<User> | null>;
}
