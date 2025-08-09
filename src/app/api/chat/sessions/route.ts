// src/app/api/chat/sessions/route.ts
import { ChatController } from '@/lib/chat/infrastructure/api/chat.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const chatController = new ChatController();

// This endpoint is public for starting a new chat session.
export const POST = apiHandler((req: NextRequest) =>
  chatController.startSession(req)
);

// This endpoint is protected for admins to get all sessions.
export const GET = apiHandler((req: NextRequest) =>
    chatController.getAllSessions(req)
, ['Admin', 'SAdmin']);