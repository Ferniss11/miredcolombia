
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, User, Clock, Search, Bot } from 'lucide-react';
import { getChatSessionsAction } from '@/lib/agent-actions';
import type { ChatSessionWithTokens } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';

export default function ConversationsPage() {
    const [sessions, setSessions] = useState<ChatSessionWithTokens[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoadingSessions(true);
            const result = await getChatSessionsAction();
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else if (result.sessions) {
                setSessions(result.sessions);
            }
            setIsLoadingSessions(false);
        };

        fetchSessions();
    }, [toast]);
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredSessions = sessions.filter(session => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = session.userName.toLowerCase().includes(query) ||
                             session.userPhone.includes(query);

        // Add filter logic here when available (e.g., unread, needs reply)
        const matchesFilter = true; // Placeholder for now

        return matchesQuery && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <MessageSquare className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Conversaciones</h1>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Bandeja de Entrada</CardTitle>
                    <CardDescription>Supervisa y participa en las interacciones de los usuarios con los agentes de IA.</CardDescription>
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
                         <ToggleGroup type="single" value={filter} onValueChange={(value) => value && setFilter(value)} defaultValue="all">
                            <ToggleGroupItem value="all" aria-label="Todos los chats">Todos</ToggleGroupItem>
                            <ToggleGroupItem value="unread" aria-label="Chats no leídos">No Leídos</ToggleGroupItem>
                            <ToggleGroupItem value="reply" aria-label="Necesita respuesta">Necesita Respuesta</ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        {isLoadingSessions ? (
                            Array.from({ length: 5 }).map((_, i) => (
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
                                <Link key={session.id} href={`/dashboard/admin/conversations/${session.id}`} className="block">
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
                                            <div className="flex justify-between items-end mt-1">
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {session.userPhone}
                                                </p>
                                                <Badge variant="outline" className="flex items-center gap-1.5">
                                                    <Bot className="h-3 w-3"/>
                                                    {session.totalTokens} tokens
                                                </Badge>
                                            </div>
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
