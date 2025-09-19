// src/app/api/chat/sessions/[sessionId]/messages/route.ts
import { ChatController } from '@/lib/chat/infrastructure/api/chat.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin-config';

const chatController = new ChatController();

type RouteContext = { params: { sessionId: string } };

// This endpoint is public, as both guests and authenticated users can send messages.
// The use case and controller will handle identifying the user if they are logged in.
export const POST = apiHandler(async (req: NextRequest, { params }: RouteContext) => {

    // --- Authentication (optional) ---
    let userId: string | undefined = undefined;
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (idToken && adminAuth) {
        try {
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            userId = decodedToken.uid;
        } catch (error) {
            console.log("Could not verify token for message posting (guest user).");
        }
    }

    // --- Body Parsing (Done ONCE here) ---
    const contentType = req.headers.get('content-type');
    let userMessage: string;
    let document: File | null = null;

    if (contentType?.includes('multipart/form-data')) {
        const formData = await req.formData();
        userMessage = formData.get('currentMessage') as string;
        document = formData.get('document') as File | null;
    } else {
        const json = await req.json();
        userMessage = json.userMessage;
    }

    const businessId = req.nextUrl.searchParams.get('businessId') || undefined;
    
    // --- Pass Parsed Data to Controller ---
    const payload = { 
        userMessage, 
        userId, 
        businessId, 
        document,
        sessionId: params.sessionId,
    };
    return chatController.postMessage(payload);

});
