
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Eye, MessageSquare } from 'lucide-react';
import { getChatSessionsAction } from '@/lib/agent-actions';
import type { ChatSessionWithTokens } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConversationsPage() {
    const [sessions, setSessions] = useState<ChatSessionWithTokens[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
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
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    
    const handleRowClick = (sessionId: string) => {
        router.push(`/dashboard/admin/conversations/${sessionId}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <MessageSquare className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Conversaciones de Usuarios</h1>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Conversaciones</CardTitle>
                    <CardDescription>Supervisa las interacciones de los usuarios con el agente de IA.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Fecha Creación</TableHead>
                                <TableHead className="text-right">Mensajes</TableHead>
                                <TableHead className="text-right">Coste Total Tokens</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingSessions ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : sessions.length > 0 ? (
                                sessions.map(session => (
                                    <TableRow key={session.id} onClick={() => handleRowClick(session.id)} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell>
                                            <div className="font-medium">{session.userName}</div>
                                            <div className="text-sm text-muted-foreground">{session.userPhone}</div>
                                        </TableCell>
                                        <TableCell>{formatDate(session.createdAt)}</TableCell>
                                        <TableCell className="text-right">{session.messageCount}</TableCell>
                                        <TableCell className="text-right font-bold font-mono">{session.totalTokens}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">
                                                <Eye className="mr-2 h-3 w-3" />
                                                Ver
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        No hay conversaciones todavía.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
