// Defines the port for authentication operations.
// This interface abstracts the authentication provider (e.g., Firebase Auth),
// allowing the application to be independent of a specific auth technology.

import { UserRole } from './user.entity';

export type AuthResult = {
  uid: string;
  isNewUser: boolean;
  name?: string | null;
  email?: string | null;
};

export interface AuthRepository {
  /**
   * Initiates the Google Sign-In flow.
   * @returns A promise that resolves with the authentication result.
   */
  signInWithGoogle(): Promise<AuthResult>;

  /**
   * Signs in a user with their email and password.
   * @param email - The user's email.
   * @param password - The user's password.
   * @returns A promise that resolves with the UID of the signed-in user.
   */
  signInWithEmail(email: string, password: string): Promise<string>;

  /**
   * Signs up a new user with email and password.
   * @param name - The user's display name.
   * @param email - The user's email.
   * @param password - The user's password.
   * @param role - The user's assigned role.
   * @returns A promise that resolves with the UID of the new user.
   */
  signUpWithEmail(name: string, email: string, password: string, role: UserRole): Promise<string>;

  /**
   * Signs out the currently authenticated user.
   * @returns A promise that resolves when the sign-out is complete.
   */
  signOut(): Promise<void>;
}
