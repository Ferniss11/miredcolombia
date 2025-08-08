// src/lib/chat/domain/chat-session.entity.ts

/**
 * Represents a single chat conversation session.
 * It can be a global session or linked to a specific business.
 */
export interface ChatSession {
  id: string;
  userId?: string; // The user who initiated the chat, if they are registered
  businessId?: string; // The business this chat is associated with, if any
  userName: string;
  userPhone: string;
  userEmail?: string;
  createdAt: Date;
  updatedAt?: Date;
  
  // Aggregated analytics
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}
