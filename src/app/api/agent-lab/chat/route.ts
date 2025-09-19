// src/app/api/agent-lab/chat/route.ts
import { ChatController } from '@/lib/chat/infrastructure/api/chat.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin-config';

const controller = new ChatController();

// This endpoint is protected for admins only.
export const POST = apiHandler(async (req: NextRequest) => {
    
    const formData = await req.formData();
    const document = formData.get('document') as File | null;
    const userMessage = formData.get('currentMessage') as string;
    const { uid } = await adminAuth.verifyIdToken(req.headers.get('Authorization')?.split('Bearer ')[1]!);

    const payload = { 
        userMessage, 
        document,
        // The controller will now get these from the form data
        sessionId: formData.get('sessionId') as string,
        userId: uid,
        businessId: formData.get('businessId') as string | undefined,
        agentId: formData.get('agentId') as 'global' | 'valeria_premium' | 'business',
        isLabMode: true, // Flag to indicate this is a lab session
    };

    // The main postMessage controller now handles both lab and real chats
    return controller.postMessage(payload, { params: {} });

}, ['Admin', 'SAdmin']);
