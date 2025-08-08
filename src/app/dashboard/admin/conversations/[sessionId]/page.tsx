
'use client';

import { useEffect, useState, useRef, FormEvent, KeyboardEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ChatSessionWithTokens, ChatMessage, AgentConfig } from '@/lib/chat-types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, User, Send, UserCog, BrainCircuit, ChevronDown, Copy, Clock, Reply, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from '@/components/ui/separator';

function ChatConversationPage() {
    const { sessionId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { userProfile, user } = useAuth();
    const [session, setSession] = useState<ChatSessionWithTokens | null>(null);
    const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof sessionId === 'string' && user) {
            const fetchDetails = async () => {
                setIsLoading(true);
                try {
                    const idToken = await user.getIdToken();
                    // TODO: This should call a new endpoint like /api/chat/sessions/[sessionId]
                    // For now, we simulate the fetch logic.
                    // const result = await getChatSessionDetailsAction(sessionId);
                    const result = { error: "Endpoint not implemented yet for admin session details." };

                    if (result.error) {
                        toast({ variant: 'destructive', title: 'Error', description: result.error });
                        // router.push('/dashboard/admin/conversations');
                    } else {
                        // setSession(result.session);
                        // setMessages(result.messages);
                        // setAgentConfig(result.agentConfig || null);
                    }
                } catch(e) {
                    toast({ variant: 'destructive', title: 'Error de Autenticación', description: 'No se pudo obtener el token.'});
                } finally {
                    setIsLoading(false);
                }
            };
            // fetchDetails(); // Re-enable when endpoint is ready
            setIsLoading(false); // Temporary for now
        }
    }, [sessionId, router, toast, user]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'auto' });
        }
    }, [messages]);
    
    const formatCost = (cost: number) => {
        if (cost === 0) return '€0.00';
        return `~${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4 }).format(cost)}`;
    }

    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    const handleCopySessionId = () => {
        if (!session) return;
        navigator.clipboard.writeText(session.id);
        toast({ title: 'Copiado', description: 'El ID de la sesión ha sido copiado.' });
    };

    const handleSendMessage = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !userProfile || !session) return;

        setIsSending(true);
        const tempId = Math.random().toString();
        const pendingMessage: ChatMessage = {
            id: tempId,
            text: newMessage,
            role: 'admin',
            authorName: userProfile.name || 'Admin',
            timestamp: new Date().toISOString(),
            replyTo: replyTo ? {
                messageId: replyTo.id,
                text: replyTo.text,
                author: replyTo.role === 'user' ? (session.userName || 'Usuario') : (replyTo.authorName || 'Agente')
            } : null,
        }
        setMessages(prev => [...prev, pendingMessage]);
        setNewMessage('');
        setReplyTo(null);
        
        // const result = await postAdminMessageAction({
        //     sessionId: session.id,
        //     text: newMessage,
        //     authorName: userProfile.name || 'Admin',
        //     replyTo: replyTo ? {
        //         messageId: replyTo.id,
        //         text: replyTo.text,
        //         author: replyTo.role === 'user' ? (session.userName || 'Usuario') : (replyTo.authorName || 'Agente')
        //     } : undefined,
        // });
        
        // if (result.error) {
        //     toast({ variant: 'destructive', title: 'Error', description: result.error });
        //     setMessages(prev => prev.filter(m => m.id !== tempId));
        // } else if (result.newMessage) {
        //     if (typeof sessionId === 'string') {
        //         const updatedSession = await getChatSessionDetailsAction(sessionId);
        //         if (updatedSession.session) setSession(updatedSession.session);
        //     }
        //     setMessages(prev => prev.map(m => m.id === tempId ? { ...result.newMessage } as ChatMessage : m));
        // }
        setIsSending(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }

    const getMessageComponent = (msg: ChatMessage) => {
        const isUser = msg.role === 'user';
        const isAdmin = msg.role === 'admin';
        
        const alignment = isUser ? 'justify-end' : 'justify-start';
        const bgColor = isUser ? 'bg-primary/10 text-primary-foreground' : isAdmin ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-muted';
        const avatar = isUser ? (
             <Avatar className="w-8 h-8 flex-shrink-0">
               <AvatarFallback className="bg-muted"><User size={18} /></AvatarFallback>
             </Avatar>
        ) : (
             <Avatar className="w-8 h-8 flex-shrink-0">
               <AvatarFallback className={cn(isAdmin ? 'bg-yellow-400 text-black' : 'bg-primary/10')}>
                   {isAdmin ? <UserCog size={18} /> : <Bot size={18} />}
               </AvatarFallback>
            </Avatar>
        );
        
        const authorName = isAdmin ? (msg.authorName || 'Admin') : isUser ? (session?.userName || 'Usuario') : 'Agente IA';

        return (
             <div key={msg.id} className={cn("group flex items-end gap-2 w-full", alignment)}>
               {!isUser && avatar}
                <div className="flex flex-col gap-1 w-full max-w-lg">
                     <span className={cn("text-xs text-muted-foreground", isUser ? 'text-right' : 'text-left')}>{authorName}</span>
                    <div className={cn('relative p-3 rounded-lg shadow-sm w-fit', bgColor, isUser ? 'ml-auto rounded-br-none' : 'mr-auto rounded-bl-none')}>
                        {msg.replyTo && (
                            <div className="p-2 mb-2 border-l-2 border-primary/50 bg-black/5 dark:bg-white/5 rounded-md min-w-0">
                                <p className="font-bold text-xs">{msg.replyTo.author}</p>
                                <p className="text-xs opacity-80 truncate">{msg.replyTo.text}</p>
                            </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity top-0 -right-8">
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReplyTo(msg)}>
                                <Reply className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                     <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground pr-2", isUser && "justify-end")}>
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(msg.timestamp)}</span>
                    </div>
                </div>
                {isUser && avatar}
            </div>
        )
    };

    if (isLoading) {
        return <div className="p-4"><Skeleton className="h-full w-full" /></div>;
    }
    
    if (!session) return <div>No se encontró la sesión. (Esta página necesita ser conectada a la nueva API)</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-theme(space.24))] bg-background">
            <header className="p-3 border-b bg-card">
                 <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                        <Link href="/dashboard/admin/conversations">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <Avatar className="h-10 w-10 border">
                        <AvatarFallback className="bg-muted"><User /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="font-bold">{session.userName}</h1>
                        <p className="text-xs text-muted-foreground">{session.userPhone} &middot; {session.userEmail || 'Email no disponible'}</p>
                    </div>
                </div>
                 <Collapsible className="mt-2">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                            <BrainCircuit className="h-4 w-4 mr-2"/>
                            Metadatos de IA
                            <ChevronDown className="h-4 w-4 ml-auto" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="p-3 mt-2 rounded-md bg-muted/50 border space-y-2 text-xs">
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Coste Total:</span>
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                                    {formatCost(session.totalCost)}
                                </Badge>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Modelo IA:</span>
                                <span className="font-mono text-xs">{agentConfig?.model || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">ID de Sesión:</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-mono text-xs truncate max-w-[120px]">{session.id}</span>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCopySessionId}><Copy className="h-3 w-3"/></Button>
                                </div>
                            </div>
                            <Separator />
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Tokens Totales:</span>
                                <span>{session.totalTokens.toLocaleString('es-ES')}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Tokens de Entrada (Input):</span>
                                <span>{session.totalInputTokens.toLocaleString('es-ES')}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Tokens de Salida (Output):</span>
                                <span>{session.totalOutputTokens.toLocaleString('es-ES')}</span>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </header>
            
            <main ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/30">
                {messages.map((msg) => getMessageComponent(msg))}
                {messages.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No hay mensajes en esta conversación.</p>
                )}
            </main>
            
            <footer className="p-3 border-t bg-card">
                {replyTo && (
                    <div className="flex items-center justify-between p-2 mb-2 bg-muted rounded-md text-sm">
                        <div className="overflow-hidden">
                            <p className="font-bold text-primary">Respondiendo a {replyTo.role === 'user' ? session.userName : 'Agente'}</p>
                            <p className="text-muted-foreground truncate">{replyTo.text}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-start gap-2">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe tu mensaje como administrador..."
                        disabled={isSending}
                        autoComplete="off"
                        rows={1}
                        className="min-h-0 h-10 resize-none"
                    />
                    <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                        <Send size={18} />
                    </Button>
                </form>
            </footer>
        </div>
    );
}

export default ChatConversationPage;
