// src/app/api/agent-lab/chat/route.ts
import { ChatController } from '@/lib/chat/infrastructure/api/chat.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const controller = new ChatController();

// This endpoint is protected for admins only.
export const POST = apiHandler(async (req: NextRequest) => {
    
    // We must read the FormData from the request *once* at the entry point.
    const formData = await req.formData();
    const document = formData.get('document') as File | null;
    const userMessage = formData.get('currentMessage') as string;
    const sessionId = formData.get('sessionId') as string;
    const businessId = formData.get('businessId') as string | undefined;
    const agentId = formData.get('agentId') as 'global' | 'valeria_premium' | 'business';
    const userId = formData.get('userId') as string;

    const payload = { 
        userMessage, 
        document,
        sessionId,
        userId,
        businessId,
        agentId,
        isLabMode: true, // Flag to indicate this is a lab session
    };

    // Pass the already-parsed data to the controller.
    // The controller no longer deals with the NextRequest object directly.
    return controller.postMessage(payload);

}, ['Admin', 'SAdmin']);
