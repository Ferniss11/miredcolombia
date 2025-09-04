
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatWidget from '@/components/chat/ChatWidget';

// A simple embedded chat experience for premium users
export default function ValeriaDashboardPage() {
    const { user, claims } = useAuth();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const planName = claims?.valeria_plan === 'valeria_premium' ? 'Plan Premium' 
                    : claims?.valeria_plan === 'valeria_pro' ? 'Plan PRO' 
                    : 'Premium';

    if (!isClient) {
        // You can return a skeleton loader here
        return null;
    }

    return (
        <div className="h-[calc(100vh-8rem)] w-full flex flex-col">
            <header className="p-4 border-b">
                <h1 className="text-2xl font-bold font-headline">Chat con Valeria - {planName}</h1>
                <p className="text-muted-foreground">Tu asistente personal con capacidades mejoradas.</p>
            </header>
            <main className="flex-1 overflow-hidden p-4">
                {/* 
                  The ChatWidget component is smart enough to detect if a user is premium 
                  and will use the appropriate agent configuration. 
                  By rendering it here, we provide a dedicated space for the chat.
                */}
                <div className="h-full w-full rounded-lg border bg-card">
                   <ChatWidget />
                </div>
            </main>
        </div>
    );
}
