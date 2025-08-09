// src/lib/chat/domain/chat.repository.ts
import type { ChatMessage } from './chat-message.entity';
import type { ChatSession } from './chat-session.entity';

/**
 * Defines the contract (port) for interacting with the chat data persistence layer.
 * This allows the application layer to be independent of the database implementation (e.g., Firestore).
 */
export interface ChatRepository {
  /**
   * Creates a new chat session and its initial message in a single atomic transaction.
   * @param sessionData - The initial data for the session.
   * @param initialMessageText - The text for the first message (e.g., a welcome message).
   * @returns A promise that resolves with the newly created session and message.
   */
  createSessionWithInitialMessage(
    sessionData: Omit<ChatSession, 'id'>,
    initialMessageText: string
  ): Promise<{ session: ChatSession; message: ChatMessage }>;

  /**
   * Finds a chat session by its unique identifier.
   * @param sessionId - The ID of the session to find.
   * @param businessId - Optional context for business chats.
   * @returns The ChatSession entity or null if not found.
   */
  findSessionById(sessionId: string, businessId?: string): Promise<ChatSession | null>;
  
  /**
   * Finds a chat session by the user's phone number.
   * @param phone - The phone number to search for.
   * @param businessId - Optional context for business chats.
   * @returns The most recent ChatSession entity for that phone number, or null if not found.
   */
  findSessionByPhone(phone: string, businessId?: string): Promise<ChatSession | null>;

  /**
   * Saves a new message to a specific chat session.
   * @param message - The message entity to save.
   * @returns The saved message entity, possibly with a database-generated ID.
   */
  saveMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage>;

  /**
   * Retrieves the full message history for a given chat session.
   * @param sessionId - The ID of the session.
   * @param businessId - Optional context for business chats.
   * @returns An array of ChatMessage entities, ordered by timestamp.
   */
  getHistory(sessionId: string, businessId?: string): Promise<ChatMessage[]>;
  
  /**
   * Retrieves all chat sessions, typically for an admin view.
   * @returns An array of all ChatSession entities.
   */
  findAllSessions(): Promise<ChatSession[]>;
}
