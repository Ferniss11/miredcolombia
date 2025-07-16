'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getChatSessionDetailsAction, postAdminMessageAction } from '@/lib/agent-actions';
import type { ChatSessionWithTokens, ChatMessage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, User, Clock, Hash, Mail, Phone, Send, UserCog, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';


function ChatConversationPage() {
    const { sessionId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { userProfile } = useAuth();
    const [session, setSession] = useState<ChatSessionWithTokens | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof sessionId === 'string') {
            const fetchDetails = async () => {
                setIsLoading(true);
                const result = await getChatSessionDetailsAction(sessionId);
                if (result.error) {
                    console.error(result.error);
                    toast({ variant: 'destructive', title: 'Error', description: result.error });
                    router.push('/dashboard/admin/conversations');
                } else if (result.session && result.messages) {
                    setSession(result.session);
                    setMessages(result.messages);
                }
                setIsLoading(false);
            };
            fetchDetails();
        }
    }, [sessionId, router, toast]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userProfile) return;

        setIsSending(true);
        const result = await postAdminMessageAction({
            sessionId: sessionId as string,
            text: newMessage,
            authorName: userProfile.name || 'Admin',
        });
        
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else if (result.newMessage) {
            setMessages(prev => [...prev, result.newMessage as ChatMessage]);
            setNewMessage('');
        }
        setIsSending(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };
    
    const getMessageComponent = (msg: ChatMessage) => {
        const isFromUser = msg.role === 'user';
        const isFromAdmin = msg.role === 'admin';
        const isFromModel = msg.role === 'model';
        
        let alignment = 'justify-start';
        let bgColor = 'bg-gray-100 dark:bg-gray-800';
        let avatarIcon = <Bot size={20} />;

        if (isFromUser) {
            alignment = 'justify-end';
            bgColor = 'bg-blue-100 dark:bg-blue-900/50';
            avatarIcon = <User size={20} />;
        } else if (isFromAdmin) {
            alignment = 'justify-end';
            bgColor = 'bg-yellow-100 dark:bg-yellow-900/50';
            avatarIcon = <UserCog size={20} />;
        }
        
        const avatar = (
            <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className={cn(
                    isFromModel && 'bg-primary text-primary-foreground',
                    isFromUser && 'bg-muted',
                    isFromAdmin && 'bg-yellow-400 text-black'
                )}>
                    {avatarIcon}
                </AvatarFallback>
            </Avatar>
        );

        return (
             <div key={msg.id || Math.random()} className={cn("flex items-start gap-3", alignment)}>
               {(isFromModel) && avatar}
                <div className="flex flex-col gap-1 w-full max-w-lg">
                    <div className={cn('p-3 rounded-lg', bgColor)}>
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                    </div>
                    <div className={cn("text-xs text-muted-foreground flex items-center gap-2", alignment === 'justify-end' ? 'flex-row-reverse' : 'flex-row' )}>
                        <span>{formatDate(msg.timestamp)}</span>
                        {msg.usage && <Badge variant="secondary">{msg.usage.totalTokens} tokens</Badge>}
                        {isFromAdmin && <span className="font-medium">({msg.authorName || 'Admin'})</span>}
                    </div>
                </div>
                {(isFromUser || isFromAdmin) && avatar}
            </div>
        )
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardHeader>
                    <CardContent className="space-y-6"><Skeleton className="h-16 w-full" /><Skeleton className="h-24 w-full" /></CardContent>
                </Card>
            </div>
        );
    }
    
    if (!session) return <div>No se encontró la sesión.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-theme(space.24))]">
             <Button variant="outline" size="sm" asChild className="mb-4 w-fit">
                <Link href="/dashboard/admin/conversations">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Todas las Conversaciones
                </Link>
            </Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Main Chat Area */}
                <div className="lg:col-span-2 flex flex-col h-full bg-card border rounded-lg">
                    <div className="p-4 border-b">
                        <h1 className="text-2xl font-bold font-headline">{session.userName}</h1>
                        <p className="text-muted-foreground">Viendo la conversación</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollAreaRef}>
                        {messages.map((msg) => getMessageComponent(msg))}
                        {messages.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No hay mensajes en esta conversación.</p>
                        )}
                    </div>
                    
                    <div className="p-4 border-t bg-background">
                        <form onSubmit={handleSendMessage} className="flex items-start gap-2">
                             <Avatar className="mt-1">
                                <AvatarFallback className="bg-yellow-400 text-black"><UserCog size={20}/></AvatarFallback>
                             </Avatar>
                            <Textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe tu respuesta como administrador..."
                                disabled={isSending}
                                className="min-h-12"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                            <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                                <Send size={18} />
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Contact & Session Details Sidebar */}
                <div className="lg:col-span-1 h-full overflow-y-auto">
                    <div className="space-y-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>Detalles del Contacto</CardTitle>
                                <CardDescription>Información sobre el usuario.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                 <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-muted-foreground"/>
                                    <span>{session.userName}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-muted-foreground"/>
                                    <span>{session.userPhone}</span>
                                 </div>
                                  <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-muted-foreground"/>
                                    <span>{session.userEmail || 'No disponible'}</span>
                                 </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Metadatos</CardTitle>
                                <CardDescription>Información sobre esta sesión de chat.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4"/>Creada</span>
                                    <span>{formatDate(session.createdAt)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Hash className="w-4 h-4"/>Session ID</span>
                                    <Badge variant="outline">{session.id.slice(0, 8)}...</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Mensajes</span>
                                    <span>{session.messageCount}</span>
                                </div>
                                 <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4"/>Tokens Totales</span>
                                    <span className="font-mono font-bold">{session.totalTokens}</span>
                                 </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatConversationPage;
