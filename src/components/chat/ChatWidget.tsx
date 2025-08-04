
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
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
import { X, Send, User, Bot, Loader2, Sparkles, Phone, Building, MessageSquareQuote, UserCog, Clock, RotateCcw } from 'lucide-react';
import { LuBotMessageSquare } from "react-icons/lu";
import Link from 'next/link';
import { startChatSessionAction, postMessageAction, getChatHistoryAction } from '@/lib/chat-actions';
import { startBusinessChatSessionAction, postBusinessMessageAction, getBusinessChatHistoryAction } from '@/lib/business-chat-actions';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/lib/chat-types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useChat } from '@/context/ChatContext';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


type ChatWidgetProps = {
  embedded?: boolean; 
};

const formSchema = z.object({
  userName: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  userPhone: z.string().min(7, { message: 'El teléfono es obligatorio.' }),
  userEmail: z.string().email({ message: 'Debe ser un email válido.' }).optional(),
  acceptTerms: z.boolean().refine((data) => data === true, {
    message: 'Debes aceptar los términos y condiciones.',
  }),
});

const migrationProactiveMessages = [
  "¡Hola! ¿Dudas sobre migración?",
  "Tu asistente virtual está aquí.",
  "¿En qué puedo ayudarte hoy?",
  "Pregúntame sobre trámites.",
  "¿Listo para empezar tu viaje a España?"
];

const businessProactiveMessages = [
    "¡Hola! ¿Puedo ayudarte con algo?",
    "¿Tienes alguna pregunta sobre nuestros servicios?",
    "¡No dudes en consultarme lo que necesites!",
    "Estoy aquí para ayudarte a reservar o a responder tus dudas."
];

const allGeneralQuestions = [
    "¿Qué tipos de visado existen para colombianos?",
    "¿Cómo puedo homologar mi título universitario?",
    "¿Qué necesito para empadronarme en España?",
    "¿Cuáles son los primeros pasos al llegar a España?",
    "¿Cómo funciona el sistema de salud para inmigrantes?",
    "¿Puedo trabajar mientras estudio?",
    "¿Qué es la tarjeta TIE y cómo la consigo?",
    "¿Es difícil encontrar vivienda en Madrid?",
    "¿Cuánto cuesta vivir en España?",
    "¿Cómo puedo traer a mi familia a España?",
    "¿Qué impuestos debo pagar como residente?",
    "¿Cómo funciona el transporte público en las grandes ciudades?",
];

const allBusinessQuestions = [
    "¿Cuál es vuestro horario de atención?",
    "¿Cómo puedo reservar una cita?",
    "¿Dónde estáis ubicados exactamente?",
    "¿Qué servicios ofrecéis?",
    "¿Cuáles son los precios?",
    "¿Tenéis disponibilidad para mañana?",
];


export default function ChatWidget({ embedded = false }: ChatWidgetProps) {
  const { 
    isChatOpen, 
    setChatOpen, 
    chatContext, 
    isChatVisible 
  } = useChat();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Omit<ChatMessage, 'id'>[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [proactiveMessage, setProactiveMessage] = useState('');
  const [showProactive, setShowProactive] = useState(false);
  const [proactiveClosed, setProactiveClosed] = useState(false);
  const [proactiveCloseCount, setProactiveCloseCount] = useState(0);

  const [userHasInteracted, setUserHasInteracted] = useState(false);
  
  const [isPending, startTransition] = useTransition();
  const [initialQuestion, setInitialQuestion] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: '',
      userPhone: '',
      userEmail: '',
      acceptTerms: false,
    },
  });

  const isBusinessChat = !!chatContext?.businessId;
  const suggestionPool = isBusinessChat ? allBusinessQuestions : allGeneralQuestions;
  const proactivePool = isBusinessChat ? businessProactiveMessages : migrationProactiveMessages;

  const storageKey = isBusinessChat ? `chatSessionId_${chatContext.businessId}` : 'globalChatSessionId';

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio('https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FMessage%20Notification.mp3?alt=media&token=acb27764-c909-4265-9dfb-ea3f20463c68');
        
        const handleFirstInteraction = () => {
            setUserHasInteracted(true);
            window.removeEventListener('click', handleFirstInteraction, true);
            window.removeEventListener('keydown', handleFirstInteraction, true);
        };

        window.addEventListener('click', handleFirstInteraction, true);
        window.addEventListener('keydown', handleFirstInteraction, true);
        
        // --- Session Persistence Logic ---
        const storedSessionId = localStorage.getItem(storageKey);

        const loadSession = async (id: string) => {
            setIsLoading(true);
            const action = isBusinessChat ? getBusinessChatHistoryAction : getChatHistoryAction;
            const params = isBusinessChat ? { sessionId: id, businessId: chatContext.businessId! } : { sessionId: id };
            
            // @ts-ignore
            const result = await action(params);

            if (result.success && result.history) {
                setSessionId(id);
                setMessages(result.history);
            } else {
                console.error("Failed to load session history, starting new session.", result.error);
                localStorage.removeItem(storageKey);
                setSessionId(null);
            }
            setIsLoading(false);
        };

        if (storedSessionId) {
            loadSession(storedSessionId);
        } else {
            setIsLoading(false);
        }

        return () => {
            window.removeEventListener('click', handleFirstInteraction, true);
            window.removeEventListener('keydown', handleFirstInteraction, true);
        };
    }
  }, [isBusinessChat, chatContext?.businessId, storageKey]);


  // Effect for proactive messages with progressive delay
  useEffect(() => {
      if (!isMounted || isChatOpen || proactiveClosed) {
          return;
      }

      let timeoutId: NodeJS.Timeout;

      const scheduleNextMessage = () => {
          const delays = [2000, 7000, 15000];
          const delay = delays[Math.min(proactiveCloseCount, delays.length - 1)];

          timeoutId = setTimeout(() => {
              const randomIndex = Math.floor(Math.random() * proactivePool.length);
              setProactiveMessage(proactivePool[randomIndex]);
              setShowProactive(true);
          }, delay);
      };

      scheduleNextMessage();
      
      return () => {
          clearTimeout(timeoutId);
      };

  }, [isMounted, isChatOpen, proactiveCloseCount, proactiveClosed, proactivePool]);
  
  // Effect to play sound when a new proactive message appears
  useEffect(() => {
      if (showProactive && userHasInteracted && audioRef.current) {
          audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
  }, [showProactive, proactiveMessage, userHasInteracted]);


  // Effect for rotating suggestions
  useEffect(() => {
    if (!isMounted || !isChatOpen || sessionId) {
      return;
    }

    const getNextSuggestions = () => {
        const shuffled = [...suggestionPool].sort(() => 0.5 - Math.random());
        setCurrentSuggestions(shuffled.slice(0, 3));
    };

    getNextSuggestions();
    const suggestionInterval = setInterval(getNextSuggestions, 5000);
    
    return () => clearInterval(suggestionInterval);
  }, [isMounted, isChatOpen, sessionId, suggestionPool]);

  // Effect to send the initial question after session is created
  useEffect(() => {
    if (sessionId && initialQuestion) {
        // Create user message object
        const userMessage: Omit<ChatMessage, 'id'> = { role: 'user', text: initialQuestion, timestamp: new Date().toISOString(), replyTo: null };
        
        // Use a function for state update to get the most recent messages
        setMessages(prevMessages => [...prevMessages, userMessage]);
        
        // Pass the correct, updated history to the AI
        handleSendMessage(initialQuestion, [...messages, userMessage]);

        // Clear the initial question so it doesn't get sent again
        setInitialQuestion(null);
    }
}, [sessionId, initialQuestion]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if(isChatOpen) {
      setShowProactive(false);
    }
  }, [isChatOpen]);

  const handleProactiveMessageClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProactive(false);
    setProactiveClosed(true);
  };
  
  const handleResetSession = () => {
    localStorage.removeItem(storageKey);
    setSessionId(null);
    setMessages([]);
    form.reset();
  }
  
  const handleSuggestionClick = async (question: string) => {
      setInitialQuestion(question);
      
      // Temporarily fill form for validation
      form.setValue('userName', 'Usuario');
      form.setValue('userPhone', '0000000');
      form.setValue('acceptTerms', true);

      // Trigger validation and submission
      const isValid = await form.trigger();
      if (isValid) {
        form.handleSubmit(handleFormSubmit)();
      } else {
        // Handle case where even temp data is invalid (should not happen)
         toast({ variant: 'destructive', title: 'Error', description: 'No se pudo iniciar el chat con la sugerencia.' });
        setInitialQuestion(null);
      }
  };


  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
        setError(null); // Clear previous errors
        try {
            const action = isBusinessChat ? startBusinessChatSessionAction : startChatSessionAction;
            const params = isBusinessChat ? { ...values, businessId: chatContext.businessId!, businessName: chatContext.businessName! } : { ...values };
            
            // @ts-ignore
            const result = await action(params);

            if ('isIndexError' in result && result.isIndexError) {
                sessionStorage.setItem('fullError', result.error || 'Unknown index error.');
                router.push('/errors');
                return;
            }

            if (result.success && result.sessionId) {
                localStorage.setItem(storageKey, result.sessionId);
                setMessages(result.history as Omit<ChatMessage, 'id'>[] || []);
                setSessionId(result.sessionId); 
            } else {
                setError(result.error || 'No se pudo iniciar el chat. Por favor, inténtalo de nuevo.');
                setInitialQuestion(null); 
            }
        } catch(e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown client error occurred.';
            setError(`Error de cliente al iniciar sesión: ${errorMessage}`);
        }
    });
  };

  const handleSendMessage = async (messageText: string, currentHistory: Omit<ChatMessage, 'id'>[]) => {
    if (!messageText.trim() || !sessionId || isAiResponding) return;

    setIsAiResponding(true);
    setCurrentMessage('');

    const action = isBusinessChat ? postBusinessMessageAction : postMessageAction;
    const params = { 
        sessionId, 
        message: messageText.trim(), 
        history: currentHistory,
        ...(isBusinessChat && { businessId: chatContext.businessId! })
    };

    // @ts-ignore
    const result = await action(params);
    
    if (result.success && result.response) {
      const aiMessage: Omit<ChatMessage, 'id'> = { role: 'model', text: result.response, timestamp: new Date().toISOString(), replyTo: null };
      setMessages((prev) => [...prev, aiMessage]);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
       const errorResponseMessage: Omit<ChatMessage, 'id'> = { role: 'model', text: 'Lo siento, he tenido un problema y no puedo responder ahora mismo.', timestamp: new Date().toISOString(), replyTo: null };
      setMessages((prev) => [...prev, errorResponseMessage]);
    }
    setIsAiResponding(false);
  };
  
  const handleFormSubmitAndSend = (e: React.FormEvent) => {
      e.preventDefault();
      const userMessage: Omit<ChatMessage, 'id'> = { role: 'user', text: currentMessage.trim(), timestamp: new Date().toISOString(), replyTo: null };
      const currentHistory = [...messages];
      setMessages(prev => [...prev, userMessage]);
      handleSendMessage(currentMessage, currentHistory);
  }

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  
  const renderWelcomeContent = () => {
    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    {isBusinessChat ? <Building className="h-5 w-5 text-primary"/> : <Phone className="h-5 w-5 text-primary"/>}
                    <h3 className="font-bold font-headline">{isBusinessChat ? `Asistente de ${chatContext?.businessName}` : "Asistente de Inmigración"}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                    {isBusinessChat
                        ? `Hola, ¿listo para chatear con ${chatContext?.businessName}? Solo necesitamos unos datos para empezar.`
                        : 'Necesitamos unos datos para poder ayudarte mejor. Si ya has hablado con nosotros, usa el mismo teléfono para continuar la conversación.'
                    }
                </p>
                <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground"><MessageSquareQuote className="h-4 w-4"/> O pregúntale directamente...</p>
                    <div className="flex flex-col gap-2">
                        {currentSuggestions.map((q, i) => (
                            <Button 
                                key={i} 
                                variant="outline" 
                                size="sm" 
                                className="w-full text-left justify-start h-auto whitespace-normal animate-in fade-in duration-500" 
                                onClick={() => handleSuggestionClick(q)}
                                disabled={isPending}
                            >
                                {q}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="pt-6 border-t mt-6">
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
                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTitle>Error al Iniciar Chat</AlertTitle>
                                <AlertDescription>
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </form>
                </Form>
            </div>
        </div>
    )
  }

  const renderChatContent = () => {
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        )
    }

    if (!sessionId) {
      return (
        <ScrollArea className="h-full">
            {renderWelcomeContent()}
        </ScrollArea>
      );
    }

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
                <div key={index} className={cn("flex items-end gap-2 w-full", alignment)}>
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

  // If embedded, render directly without triggers or pop-ups
  if (embedded) {
    return (
        <div className="h-full flex flex-col shadow-2xl w-full border-primary border rounded-lg">
           {isMounted ? renderChatContent() : <div className='flex-1 flex items-center justify-center'><Loader2 className='animate-spin'/></div>}
        </div>
    )
  }

  if (!isChatVisible) {
    return null;
  }

  return (
    <>
      {isMounted && (
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetSession} title="Empezar de nuevo">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                    </SheetHeader>
                    <div className="flex-1 min-h-0">
                      {isMounted ? renderChatContent() : <div className='flex-1 flex items-center justify-center'><Loader2 className='animate-spin'/></div>}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      )}
    </>
  );
}

    

    