
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, User, Clock, Search, Bot, Sparkles, ArrowRight } from 'lucide-react';
import { getBusinessChatSessionsAction } from '@/lib/business-chat-actions';
import type { ChatSessionWithTokens } from '@/lib/chat-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

function AgentNotActiveCta() {
    return (
        <div className="flex items-center justify-center p-4">
            <Card className="relative max-w-2xl w-full overflow-hidden text-center bg-muted/30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50 z-0"></div>
                 <CardContent className="p-8 sm:p-12 relative z-10 flex flex-col items-center">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                       <Bot className="w-16 h-16 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold font-headline">Activa tu Asistente IA</h2>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                       Actualmente tu agente de IA está desactivado. Habilítalo para empezar a gestionar automáticamente las consultas de tus clientes y ver las conversaciones aquí.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/dashboard/advertiser/agent">
                            <Sparkles className="mr-2 h-4 w-4" /> Activar Agente Ahora <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}


export default function AdvertiserConversationsPage() {
    const [sessions, setSessions] = useState<ChatSessionWithTokens[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const { user, userProfile, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user && userProfile?.businessProfile?.isAgentEnabled) {
            const fetchSessions = async () => {
                setIsLoading(true);
                const idToken = await user.getIdToken();
                const result = await getBusinessChatSessionsAction(idToken);
                if (result.error) {
                    toast({ variant: 'destructive', title: 'Error', description: result.error });
                } else if (result.sessions) {
                    setSessions(result.sessions);
                }
                setIsLoading(false);
            };
            fetchSessions();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [toast, authLoading, user, userProfile]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredSessions = sessions.filter(session => {
        const query = searchQuery.toLowerCase();
        return session.userName.toLowerCase().includes(query) ||
               (session.userPhone && session.userPhone.includes(query));
    });

    if (authLoading) {
        return (
             <div className="space-y-6">
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-64 w-full" />
             </div>
        );
    }
    
    if (!userProfile?.businessProfile?.isAgentEnabled) {
        return <AgentNotActiveCta />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <MessageSquare className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Conversaciones del Negocio</h1>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Bandeja de Entrada</CardTitle>
                    <CardDescription>Supervisa y participa en las interacciones de los usuarios con tu agente de IA.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o teléfono..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border-b">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                </div>
                            ))
                        ) : filteredSessions.length > 0 ? (
                            filteredSessions.map(session => (
                                <Link key={session.id} href={`/dashboard/advertiser/conversations/${session.id}`} className="block">
                                    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                <User className="h-6 w-6" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold">{session.userName}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3"/>
                                                    {formatDate(session.createdAt)}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate mt-1">
                                                {session.userPhone}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-16">
                                <p>No se encontraron conversaciones.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}

    