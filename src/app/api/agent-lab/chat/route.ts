// src/app/api/agent-lab/chat/route.ts
import { ChatController } from '@/lib/chat/infrastructure/api/chat.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin-config';

const controller = new ChatController();

// This endpoint is protected for admins only.
export const POST = apiHandler(async (req: NextRequest) => {
    
    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string;
    const document = formData.get('document') as File | null;
    let userMessage = formData.get('currentMessage') as string;
    const agentId = formData.get('agentId') as 'global' | 'valeria_premium' | 'business';
    const businessId = formData.get('businessId') as string | undefined;

    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return apiHandler.unauthorized();
    const { uid: userId } = await adminAuth.verifyIdToken(token);

    const payload = { 
        userMessage, 
        userId, 
        businessId, 
        document,
        isLabMode: true, // Flag to indicate this is a lab session
        agentId: agentId,
    };

    // The main postMessage controller now handles both lab and real chats
    return controller.postMessage(payload, { params: { sessionId } });

}, ['Admin', 'SAdmin']);
