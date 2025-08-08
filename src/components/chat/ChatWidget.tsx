
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Send, User, Bot, Loader2, Sparkles, Phone, Building, MessageSquareQuote, UserCog, Clock, RotateCcw, AlertCircle } from 'lucide-react';
import { LuBotMessageSquare } from "react-icons/lu";
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/lib/chat-types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useChat } from '@/context/ChatContext';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

// --- Welcome Form Sub-component ---
const formSchema = z.object({
  userName: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  userPhone: z.string().min(7, { message: 'El teléfono es obligatorio.' }),
  userEmail: z.string().email({ message: 'Debe ser un email válido.' }).optional().or(z.literal('')),
  acceptTerms: z.boolean().refine((data) => data === true, {
    message: 'Debes aceptar los términos y condiciones.',
  }),
});

type WelcomeFormProps = {
  onSessionStarted: (sessionId: string, history: ChatMessage[]) => void;
  isBusinessChat: boolean;
  businessContext?: { businessId: string, businessName: string };
}

const WelcomeForm = ({ onSessionStarted, isBusinessChat, businessContext }: WelcomeFormProps) => {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { userName: '', userPhone: '', userEmail: '', acceptTerms: false },
    });

    const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsPending(true);
        setError(null);
        try {
            const payload: any = {
                userName: values.userName,
                userPhone: values.userPhone,
            };
            if (values.userEmail) {
                payload.userEmail = values.userEmail;
            }
            if (isBusinessChat && businessContext?.businessId) {
                payload.businessId = businessContext.businessId;
            }

            const response = await fetch('/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            
            if (!response.ok) {
                if (result.error?.fullError) {
                    sessionStorage.setItem('fullError', result.error.fullError);
                    router.push('/errors');
                    return;
                }
                throw new Error(result.error?.message || 'Error desconocido al iniciar la sesión.');
            }
            
            onSessionStarted(result.sessionId, result.history);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown client error occurred.';
            setError(`${errorMessage}`);
        } finally {
            setIsPending(false);
        }
    };
    
    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col h-full p-4">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    {isBusinessChat ? <Building className="h-5 w-5 text-primary"/> : <Phone className="h-5 w-5 text-primary"/>}
                    <h3 className="font-bold font-headline">{isBusinessChat ? `Asistente de ${businessContext?.businessName}` : "Asistente de Inmigración"}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    {isBusinessChat
                        ? `Hola, ¿listo para chatear con ${businessContext?.businessName}? Solo necesitamos unos datos para empezar.`
                        : 'Necesitamos unos datos para poder ayudarte mejor. Si ya has hablado con nosotros, usa el mismo teléfono para continuar la conversación.'
                    }
                </p>
            </div>
            
            <div className="pt-6 border-t mt-6">
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error al Iniciar Chat</AlertTitle>
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                        <FormField control={form.control} name="userName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />
                        <FormField control={form.control} name="userPhone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl><Input placeholder="+34 600 000 000" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />
                         <FormField control={form.control} name="userEmail" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email (Opcional)</FormLabel>
                                <FormControl><Input placeholder="tu@email.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="acceptTerms" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="terms" />
                                </FormControl>
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Acepto los <Link href="/legal/terms" target="_blank" className="underline text-primary">términos y condiciones</Link>.
                                    </label>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )} />
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : "Iniciar Chat"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
      </ScrollArea>
    )
}

// --- Main Chat Widget Component ---
const migrationProactiveMessages = [
    "Recuerda apostillar todos tus documentos oficiales en Colombia antes de viajar.",
    "El empadronamiento es el primer trámite y el más importante al llegar a España. ¡No lo dejes para después!",
    "Si vienes con visa de estudiante, puedes trabajar hasta 30 horas semanales con un permiso de trabajo.",
    "Abre una cuenta bancaria tan pronto como tengas tu NIE. Facilitará todos los demás trámites.",
];

const businessProactiveMessages = [
    "¿Te gustaría reservar una cita? Puedo ver los horarios disponibles.",
    "¿Tienes alguna pregunta sobre nuestros servicios? Estoy aquí para ayudarte.",
    "No dudes en preguntar por nuestros productos más populares.",
];

const allGeneralQuestions = [
    "¿Qué papeles necesito para mi viaje?",
    "Háblame sobre el costo de vida en Madrid",
    "¿Cómo puedo encontrar mi primer piso en España?",
    "Explícame la diferencia entre NIE y TIE",
    "Tengo una duda sobre el visado, ¿puedes ayudarme?",
    "¿Qué necesito para homologar mi título?",
    "¿Cómo funciona el proceso de empadronamiento?",
    "¿Es difícil conseguir trabajo como colombiano en España?",
];

const allBusinessQuestions = [
    "¿Cuál es vuestro horario de atención?",
    "¿Me puedes dar la dirección?",
    "Quisiera reservar una cita para mañana",
    "¿Tenéis alguna promoción especial?",
    "Me gustaría saber más sobre vuestros servicios",
    "¿Cuáles son los productos más recomendados?",
];

// Helper function to shuffle an array and return the first N items
const getShuffledSample = (arr: string[], count: number) => {
    return arr.sort(() => 0.5 - Math.random()).slice(0, count);
}


export default function ChatWidget() {
  const { 
    isChatOpen, 
    setChatOpen, 
    chatContext, 
    isChatVisible 
  } = useChat();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const [proactiveMessage, setProactiveMessage] = useState('');
  const [showProactive, setShowProactive] = useState(false);
  const [proactiveClosed, setProactiveClosed] = useState(false);
  
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  // State for dynamic suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const isBusinessChat = !!chatContext?.businessId;
  const suggestionPool = isBusinessChat ? allBusinessQuestions : allGeneralQuestions;
  const proactivePool = isBusinessChat ? businessProactiveMessages : migrationProactiveMessages;

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
        const handleFirstInteraction = () => {
            setUserHasInteracted(true);
            audioRef.current = new Audio('https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FMessage%20Notification.mp3?alt=media&token=acb27764-c909-4265-9dfb-ea3f20463c68');
            window.removeEventListener('click', handleFirstInteraction, true);
            window.removeEventListener('keydown', handleFirstInteraction, true);
        };
        window.addEventListener('click', handleFirstInteraction, true);
        window.addEventListener('keydown', handleFirstInteraction, true);
        
        return () => {
            window.removeEventListener('click', handleFirstInteraction, true);
            window.removeEventListener('keydown', handleFirstInteraction, true);
        };
    }
  }, []);

  useEffect(() => {
      if (!isMounted || isChatOpen || proactiveClosed || showProactive) return;
      let timeoutId: NodeJS.Timeout;
      const scheduleNextMessage = () => {
          timeoutId = setTimeout(() => {
              const randomIndex = Math.floor(Math.random() * proactivePool.length);
              setProactiveMessage(proactivePool[randomIndex]);
              setShowProactive(true);
          }, 2000); // Wait 2s before showing first proactive message
      };
      scheduleNextMessage();
      return () => clearTimeout(timeoutId);
  }, [isMounted, isChatOpen, proactiveClosed, proactivePool, showProactive]);
  
  useEffect(() => {
      if (showProactive && userHasInteracted && audioRef.current) {
          audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
  }, [showProactive, userHasInteracted]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
      if(isChatOpen) {
        setShowProactive(false);
        // Set dynamic suggestions when chat opens with a new session
        if (!sessionId) {
            setSuggestions(getShuffledSample(suggestionPool, 3));
        }
      }
  }, [isChatOpen, sessionId, suggestionPool]);
  
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !sessionId || isAiResponding) return;
    setIsAiResponding(true);
    setCurrentMessage('');

    const userMessage: ChatMessage = { 
        id: `temp-user-${Date.now()}`,
        role: 'user', 
        text: messageText.trim(), 
        timestamp: new Date().toISOString(),
        replyTo: null,
    };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    
    try {
        const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userMessage: messageText.trim(),
                businessId: chatContext?.businessId
            }),
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error?.message || 'Error en el servidor');
        }

        const aiMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'model',
            text: result.aiResponse,
            timestamp: new Date().toISOString(),
            replyTo: null,
        };
        setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        // Rollback optimistic UI update on error
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
        setIsAiResponding(false);
    }
  };

  const handleSessionStarted = (newSessionId: string, history: ChatMessage[]) => {
    setSessionId(newSessionId);
    setMessages(history);
  };
  
  const handleFormSubmitAndSend = (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage(currentMessage);
  }
  
  const handleProactiveMessageClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProactive(false);
    setProactiveClosed(true);
  };
  
  const handleResetSession = () => {
    setSessionId(null);
    setMessages([]);
    // Get a new set of suggestions for the new session
    setSuggestions(getShuffledSample(suggestionPool, 3));
  }

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  const renderChatContent = () => {
    if (!sessionId) {
      return (
        <WelcomeForm 
            onSessionStarted={handleSessionStarted} 
            isBusinessChat={isBusinessChat}
            businessContext={chatContext || undefined}
        />
      );
    }

    const showSuggestions = messages.length <= 1;

    return (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isAdmin = msg.role === 'admin';
              const isModel = msg.role === 'model';
              const alignment = isUser ? 'justify-end' : 'justify-start';
              const bgColor = isUser ? 'bg-primary text-primary-foreground' : isAdmin ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-muted';
              const avatar = isUser ? (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-muted"><User size={18} /></AvatarFallback>
                  </Avatar>
              ) : (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={cn(isAdmin ? 'bg-yellow-400 text-black' : 'bg-primary/10 text-primary')}>
                        {isAdmin ? <UserCog size={18} /> : <Bot size={18} />}
                    </AvatarFallback>
                 </Avatar>
              );
              const authorName = isAdmin ? (msg.authorName || 'Admin') : isModel ? (chatContext?.businessName || 'Asistente IA') : '';

              return (
                <div key={msg.id || index} className={cn("flex items-end gap-2 w-full", alignment)}>
                   {!isUser && avatar}
                    <div className="flex flex-col gap-1 w-full max-w-lg">
                        {authorName && <span className={cn("text-xs text-muted-foreground", isUser ? 'text-right' : 'text-left')}>{authorName}</span>}
                        <div className={cn('p-3 rounded-lg shadow-sm w-fit', bgColor, isUser ? 'ml-auto rounded-br-none' : 'mr-auto rounded-bl-none')}>
                            <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\\n/g, '<br />') }} />
                        </div>
                        <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground pr-2", isUser && "justify-end")}>
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(msg.timestamp)}</span>
                        </div>
                    </div>
                    {isUser && avatar}
                </div>
              )
            })}
             {showSuggestions && (
                <div className="pt-4 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><MessageSquareQuote className="h-4 w-4"/> O pregúntale directamente...</p>
                    {suggestions.map((q, i) => (
                        <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="w-full text-left justify-start h-auto whitespace-normal"
                            onClick={() => handleSendMessage(q)}
                            disabled={isAiResponding}
                        >
                            {q}
                        </Button>
                    ))}
                </div>
            )}
            {isAiResponding && (
                <div className="flex items-end gap-2 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Bot size={20} />
                    </div>
                    <div className="bg-muted rounded-xl px-4 py-3 rounded-bl-none flex items-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span className="text-sm text-muted-foreground">Escribiendo...</span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background rounded-b-lg">
          <form onSubmit={handleFormSubmitAndSend} className="flex gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={isAiResponding}
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isAiResponding || !currentMessage.trim()}>
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
    );
  };

  if (!isChatVisible) {
    return null;
  }

  return (
    <>
      {isMounted && (
        <TooltipProvider>
        <div className="fixed bottom-6 right-6 z-50">
            {showProactive && !isChatOpen && proactiveMessage && (
                <div className="absolute bottom-full right-0 mb-3 w-max max-w-[280px] animate-in fade-in-50 slide-in-from-bottom-2">
                    <div className="flex items-end gap-2">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg z-10 -mr-2">
                          <LuBotMessageSquare size={20} />
                        </div>
                         <div className="relative bg-background dark:bg-card shadow-lg rounded-lg p-3 text-sm group">
                            <p>{proactiveMessage}</p>
                            <div className="absolute right-3 -bottom-1.5 w-3 h-3 bg-background dark:bg-card transform rotate-45"></div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0 h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={handleProactiveMessageClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
             <Sheet open={isChatOpen} onOpenChange={setChatOpen}>
                <SheetTrigger asChild>
                    <Button
                        className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center"
                        size="icon"
                        id="global-chat-trigger"
                    >
                        {isChatOpen ? <X size={32} /> : <Bot size={40} />}
                    </Button>
                </SheetTrigger>
                <SheetContent 
                    className="w-full sm:max-w-md p-0 flex flex-col h-full"
                    side="right"
                >
                    <SheetHeader className="p-4 border-b flex-row items-center justify-between">
                        <SheetTitle className="flex items-center gap-2 font-headline text-lg">
                            {isBusinessChat ? <Building className="h-6 w-6 text-primary" /> : <Sparkles className="h-6 w-6 text-primary" />}
                            {isBusinessChat ? `Asistente de ${chatContext.businessName}` : "Asistente de Inmigración"}
                        </SheetTitle>
                        {sessionId && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetSession}>
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Empezar de nuevo</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </SheetHeader>
                    <div className="flex-1 min-h-0">
                      {isMounted ? renderChatContent() : <div className='flex-1 flex items-center justify-center'><Loader2 className='animate-spin'/></div>}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
        </TooltipProvider>
      )}
    </>
  );
}
