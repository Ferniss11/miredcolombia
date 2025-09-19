// src/app/api/agent-lab/chat/route.ts
import { ChatController } from '@/lib/chat/infrastructure/api/chat.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin-config';

// The Agent Lab now uses the main ChatController to ensure logic is consistent.
const controller = new ChatController();

// This endpoint is protected for admins only.
// It will now call the standard postMessage flow, which handles document ingestion.
export const POST = apiHandler(async (req: NextRequest) => {
    // Unlike the public chat, the lab POSTs to a different URL structure, so we get sessionId from the body.
    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string;
    const document = formData.get('document') as File | null;
    let userMessage = formData.get('currentMessage') as string;
    const businessId = formData.get('businessId') as string | undefined;

    // We still need the user ID for tracking and potential context in RAG
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return apiHandler.unauthorized();
    const { uid: userId } = await adminAuth.verifyIdToken(token);

    const payload = { userMessage, userId, businessId, document };

    // The lab now simulates posting to a real session.
    // The `postMessage` controller method will handle FormData and document processing.
    return controller.postMessage(payload, { params: { sessionId } });

}, ['Admin', 'SAdmin']);
