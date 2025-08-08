// src/lib/chat/domain/chat.repository.ts
import type { ChatMessage } from './chat-message.entity';
import type { ChatSession } from './chat-session.entity';

/**
 * Defines the contract (port) for interacting with the chat data persistence layer.
 * This allows the application layer to be independent of the database implementation (e.g., Firestore).
 */
export interface ChatRepository {
  /**
   * Creates a new chat session.
   * @param sessionData - The initial data for the session.
   * @returns The newly created ChatSession entity.
   */
  createSession(sessionData: Omit<ChatSession, 'id'>): Promise<ChatSession>;

  /**
   * Finds a chat session by its unique identifier.
   * @param sessionId - The ID of the session to find.
   * @returns The ChatSession entity or null if not found.
   */
  findSessionById(sessionId: string): Promise<ChatSession | null>;
  
  /**
   * Finds a chat session by the user's phone number.
   * @param phone - The phone number to search for.
   * @returns The most recent ChatSession entity for that phone number, or null if not found.
   */
  findSessionByPhone(phone: string): Promise<ChatSession | null>;

  /**
   * Saves a new message to a specific chat session.
   * @param sessionId - The ID of the session to add the message to.
   * @param message - The message entity to save.
   * @returns The saved message entity, possibly with a database-generated ID.
   */
  saveMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage>;

  /**
   * Retrieves the full message history for a given chat session.
   * @param sessionId - The ID of the session.
   * @returns An array of ChatMessage entities, ordered by timestamp.
   */
  getHistory(sessionId: string): Promise<ChatMessage[]>;
  
  /**
   * Retrieves all chat sessions, typically for an admin view.
   * @returns An array of all ChatSession entities.
   */
  findAllSessions(): Promise<ChatSession[]>;
}
