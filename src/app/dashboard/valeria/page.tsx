
'use client';

import ChatWidget from '@/components/chat/ChatWidget';

// This is a placeholder for a more dedicated chat interface in the future.
// For now, we can prompt the user to use the global chat widget which will have the right context.

export default function ValeriaDashboardPage() {
    return (
        <div className="h-full">
             {/* The global chat widget is rendered by the layout, but we could have a dedicated one here */}
            <ChatWidget />
        </div>
    );
}
