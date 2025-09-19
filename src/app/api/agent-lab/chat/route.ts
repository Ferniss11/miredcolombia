
// src/app/api/agent-lab/chat/route.ts
import { ChatController } from '@/lib/chat/infrastructure/api/chat.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

// The Agent Lab now uses the main ChatController to ensure logic is consistent.
const controller = new ChatController();

// This endpoint is protected for admins only.
// It will now call the standard postMessage flow, which handles document ingestion.
export const POST = apiHandler(async (req: NextRequest) => {
    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string;

    // The lab now simulates posting to a real session.
    // The `postMessage` controller method will handle FormData and document processing.
    return controller.postMessage(req, { params: { sessionId } });

}, ['Admin', 'SAdmin']);
