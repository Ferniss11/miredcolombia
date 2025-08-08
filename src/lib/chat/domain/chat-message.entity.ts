// src/lib/chat/domain/chat-message.entity.ts
import type { TokenUsage } from '@/lib/chat-types';

export type ChatMessageRole = 'user' | 'model' | 'admin';

/**
 * Represents a single message within a chat conversation.
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  businessId?: string; // Context for which business this message belongs to
  role: ChatMessageRole;
  text: string;
  timestamp: Date;
  usage?: TokenUsage;
  cost?: number;
  authorName?: string; // Used for model messages sent by an admin/owner
  replyTo?: {
    messageId: string;
    text: string;
    author: string;
  } | null;
}
