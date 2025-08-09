// src/app/api/chat/sessions/[sessionId]/route.ts
import { ChatController } from '@/lib/chat/infrastructure/api/chat.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const chatController = new ChatController();

type RouteContext = { params: { sessionId: string } };

// Protected for both Admins and Advertisers (who will provide a businessId)
export const GET = apiHandler((req: NextRequest, { params }: RouteContext) =>
  chatController.getSessionDetails(req, { params: { sessionId: params.sessionId } })
, ['Admin', 'SAdmin', 'Advertiser']);
