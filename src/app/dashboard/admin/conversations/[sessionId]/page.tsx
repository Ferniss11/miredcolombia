
'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getChatSessionDetailsAction, postAdminMessageAction } from '@/lib/agent-actions';
import type { ChatSessionWithTokens, ChatMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, User, Send, UserCog } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'auto' });
        }
    }, [messages]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userProfile || !session) return;

        setIsSending(true);
        const tempId = Math.random().toString();
        const pendingMessage: ChatMessage = {
            id: tempId,
            text: newMessage,
            role: 'admin',
            authorName: userProfile.name || 'Admin',
            timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, pendingMessage]);
        setNewMessage('');
        
        const result = await postAdminMessageAction({
            sessionId: session.id,
            text: newMessage,
            authorName: userProfile.name || 'Admin',
        });
        
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else if (result.newMessage) {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...result.newMessage, id: result.newMessage.id || tempId } as ChatMessage : m));
        }
        setIsSending(false);
    };

    const getMessageComponent = (msg: ChatMessage) => {
        const isUser = msg.role === 'user';
        const isAdmin = msg.role === 'admin';
        
        const alignment = isUser ? 'justify-end' : 'justify-start';
        const bgColor = isUser ? 'bg-blue-600 text-white' : isAdmin ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-gray-100 dark:bg-gray-800';
        
        return (
             <div key={msg.id || Math.random()} className={cn("flex items-end gap-2", alignment)}>
               {!isUser && (
                   <Avatar className="w-8 h-8 flex-shrink-0">
                       <AvatarFallback className={cn(isAdmin ? 'bg-yellow-400 text-black' : 'bg-primary/10')}>
                           {isAdmin ? <UserCog size={18} /> : <Bot size={18} />}
                       </AvatarFallback>
                   </Avatar>
               )}
                <div className={cn('p-3 rounded-lg max-w-md', bgColor)}>
                    <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                </div>
            </div>
        )
    };

    if (isLoading) {
        return <div className="p-4"><Skeleton className="h-full w-full" /></div>;
    }
    
    if (!session) return <div>No se encontró la sesión.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-theme(space.24))] bg-card border rounded-lg">
             <header className="flex items-center gap-3 p-3 border-b">
                <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                    <Link href="/dashboard/admin/conversations">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-muted"><User /></AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="font-bold">{session.userName}</h1>
                    <p className="text-xs text-muted-foreground">{session.userPhone}</p>
                </div>
            </header>
            
            <main ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/30">
                {messages.map((msg) => getMessageComponent(msg))}
                {messages.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No hay mensajes en esta conversación.</p>
                )}
            </main>
            
            <footer className="p-3 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe tu mensaje como administrador..."
                        disabled={isSending}
                        autoComplete="off"
                        className="h-10"
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
