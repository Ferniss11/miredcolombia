// src/app/api/chat/sessions/[sessionId]/messages/route.ts
import { ChatController } from '@/lib/chat/infrastructure/api/chat.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const chatController = new ChatController();

type RouteContext = { params: { sessionId: string } };

export const POST = apiHandler((req: NextRequest, { params }: RouteContext) =>
  chatController.postMessage(req, { params: { sessionId: params.sessionId } })
);
