
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getChatSessionDetailsAction } from '@/lib/agent-actions';
import type { ChatSessionWithTokens, ChatMessage } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, User, Clock, Hash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


function ChatConversationPage() {
    const { sessionId } = useParams();
    const router = useRouter();
    const [session, setSession] = useState<ChatSessionWithTokens | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof sessionId === 'string') {
            const fetchDetails = async () => {
                setIsLoading(true);
                const result = await getChatSessionDetailsAction(sessionId);
                if (result.error) {
                    // Handle error, e.g., show a toast and redirect
                    console.error(result.error);
                    router.push('/dashboard/admin/conversations');
                } else if (result.session && result.messages) {
                    setSession(result.session);
                    setMessages(result.messages);
                }
                setIsLoading(false);
            };
            fetchDetails();
        }
    }, [sessionId, router]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!session) {
        return <div>No se encontró la sesión.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                     <Button variant="outline" size="sm" asChild className="mb-4">
                        <Link href="/dashboard/admin/conversations">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Todas las Conversaciones
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold font-headline">Conversación con {session.userName}</h1>
                    <p className="text-muted-foreground">{session.userPhone}</p>
                </div>
                 <Card className="w-fit">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(session.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Hash className="w-4 h-4" />
                                <span>{session.id}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={msg.id || index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                           {msg.role === 'model' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                    <Bot size={20} />
                                </div>
                           )}
                           <div className="flex flex-col gap-1 w-full max-w-lg">
                                <div className={cn('p-3 rounded-lg', msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900/50 ml-auto' : 'bg-gray-100 dark:bg-gray-800')}>
                                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                                </div>
                                <div className={cn("text-xs text-muted-foreground", msg.role === 'user' ? 'text-right' : 'text-left')}>
                                    {formatDate(msg.timestamp)}
                                    {msg.usage && (
                                        <Badge variant="secondary" className="ml-2">
                                            {msg.usage.totalTokens} tokens
                                        </Badge>
                                    )}
                                </div>
                           </div>
                             {msg.role === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <User size={20} />
                                </div>
                            )}
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No hay mensajes en esta conversación.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default ChatConversationPage;
