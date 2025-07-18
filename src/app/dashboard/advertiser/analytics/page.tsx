
import { getBusinessAnalyticsAction } from '@/lib/user-actions';
import AnalyticsClient from './AnalyticsClient';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/config';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function AdvertiserAnalyticsPage() {
    // Server-side fetch requires getting the UID differently
    // For this example, we assume there's a way to get the current user's UID on the server.
    // In a real app, this might come from a session or server-side auth helper.
    // As a workaround for this example structure, we'll fetch on the client.
    // A more robust solution would be needed for production to avoid layout shifts.

    return <AnalyticsClient/>
}
