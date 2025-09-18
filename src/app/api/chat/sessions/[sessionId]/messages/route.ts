// src/app/api/chat/sessions/[sessionId]/messages/route.ts
import { ChatController } from '@/lib/chat/infrastructure/api/chat.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const chatController = new ChatController();

type RouteContext = { params: { sessionId: string } };

// This endpoint is public, as both guests and authenticated users can send messages.
// The use case and controller will handle identifying the user if they are logged in.
export const POST = apiHandler((req: NextRequest, { params }: RouteContext) =>
  chatController.postMessage(req, { params: { sessionId: params.sessionId } })
);
