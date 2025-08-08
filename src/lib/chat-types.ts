

import { z } from 'zod';

// --- Core Enums and Schemas ---

export const ChatRoleSchema = z.enum(['user', 'model', 'admin']);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const TokenUsageSchema = z.object({
  inputTokens: z.number().default(0),
  outputTokens: z.number().default(0),
  totalTokens: z.number().default(0),
});
export type TokenUsage = z.infer<typeof TokenUsageSchema>;

// --- Agent Configuration Schema ---

export const AgentConfigSchema = z.object({
  model: z.string().default('googleai/gemini-1.5-flash-latest'),
  systemPrompt: z.string().default('You are a helpful assistant.'),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// --- Chat Message Schemas ---

export const ChatMessageSchema = z.object({
  id: z.string(),
  text: z.string(),
  role: ChatRoleSchema,
  timestamp: z.string(), // ISO string on the client
  usage: TokenUsageSchema.optional(),
  cost: z.number().optional(),
  authorName: z.string().optional(), // Used for model messages sent by an admin
  replyTo: z.object({
    messageId: z.string(),
    text: z.string(),
    author: z.string(),
  }).nullable(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// --- Chat Session Schemas ---

export const ChatSessionSchema = z.object({
  id: z.string().optional(),
  userName: z.string(),
  userPhone: z.string(),
  userEmail: z.string().optional(),
  createdAt: z.any(), // Firestore Timestamp
  updatedAt: z.any().optional(),
  totalTokens: z.number().optional(),
  totalInputTokens: z.number().optional(),
  totalOutputTokens: z.number().optional(),
  totalCost: z.number().optional(),
  agentConfig: AgentConfigSchema.optional(), // Added agent config to session
});
export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const ChatSessionWithTokensSchema = ChatSessionSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  messageCount: z.number(),
  totalInputTokens: z.number(),
  totalOutputTokens: z.number(),
  totalTokens: z.number(),
  totalCost: z.number(),
});
export type ChatSessionWithTokens = z.infer<typeof ChatSessionWithTokensSchema>;


// Business Agent config is a specific type of AgentConfig
export type BusinessAgentConfig = AgentConfig;


// --- AI Flow I/O Schemas ---

export const ChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s response.'),
  usage: TokenUsageSchema.optional(),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

    
