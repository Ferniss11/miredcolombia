
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Send, User, Bot, Loader2, Sparkles, Phone, Building, MessageSquareQuote } from 'lucide-react';
import { LuBotMessageSquare } from "react-icons/lu";
import Link from 'next/link';
import { startChatSessionAction, postMessageAction } from '@/lib/chat-actions';
import { startBusinessChatSessionAction, postBusinessMessageAction } from '@/lib/business-chat-actions';
import { useToast } from '@/hooks/use-toast';

type ClientMessage = {
    role: 'user' | 'model' | 'admin';
    text: string;
};

type ChatWidgetProps = {
  businessId?: string;
  businessName?: string;
  embedded?: boolean; // New prop to control embedded mode
};

const formSchema = z.object({
  userName: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  userPhone: z.string().min(7, { message: 'El teléfono es obligatorio.' }),
  acceptTerms: z.boolean().refine((data) => data === true, {
    message: 'Debes aceptar los términos y condiciones.',
  }),
});

const proactiveMessages = [
  "¡Hola! ¿Dudas sobre migración?",
  "Tu asistente virtual está aquí.",
  "¿En qué puedo ayudarte hoy?",
  "Pregúntame sobre trámites.",
  "¿Listo para empezar tu viaje a España?"
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


export default function ChatWidget({ businessId, businessName, embedded = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(embedded); // Start open if embedded
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const [proactiveMessage, setProactiveMessage] = useState('');
  const [showProactive, setShowProactive] = useState(false);
  const [proactiveClosed, setProactiveClosed] = useState(false);
  const [proactiveCloseCount, setProactiveCloseCount] = useState(0);

  const [userHasInteracted, setUserHasInteracted] = useState(false);

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
      acceptTerms: false,
    },
  });

  const isBusinessChat = !!businessId;
  const suggestionPool = isBusinessChat ? allBusinessQuestions : allGeneralQuestions;
  
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio('https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FAshot%20Danielyan%20-%20Message%20Alert%20Logo%20(MP3).mp3?alt=media&token=0c1febf6-9e59-4e0b-97b7-4af687234aad');
        
        const handleFirstInteraction = () => {
            setUserHasInteracted(true);
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

  // Effect for proactive messages with progressive delay
  useEffect(() => {
      if (!isMounted || isOpen || proactiveClosed) {
          return;
      }

      let timeoutId: NodeJS.Timeout;

      const scheduleNextMessage = () => {
          const delays = [2000, 7000, 15000]; // 2s, 7s, 15s
          const delay = delays[Math.min(proactiveCloseCount, delays.length - 1)];

          timeoutId = setTimeout(() => {
              const randomIndex = Math.floor(Math.random() * proactiveMessages.length);
              setProactiveMessage(proactiveMessages[randomIndex]);
              setShowProactive(true);
          }, delay);
      };

      scheduleNextMessage();
      
      return () => {
          clearTimeout(timeoutId);
      };

  }, [isMounted, isOpen, proactiveCloseCount, proactiveClosed]);
  
  // Effect to play sound when a new proactive message appears
  useEffect(() => {
      if (showProactive && userHasInteracted && audioRef.current) {
          audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
  }, [showProactive, proactiveMessage, userHasInteracted]);


  // Effect for rotating suggestions
  useEffect(() => {
    if (!isMounted || !isOpen || sessionId) {
      return;
    }

    const getNextSuggestions = () => {
        const shuffled = [...suggestionPool].sort(() => 0.5 - Math.random());
        setCurrentSuggestions(shuffled.slice(0, 3));
    };

    getNextSuggestions();
    const suggestionInterval = setInterval(getNextSuggestions, 5000);
    
    return () => clearInterval(suggestionInterval);
  }, [isMounted, isOpen, sessionId, suggestionPool]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if(isOpen) {
      setShowProactive(false);
    }
  }, [isOpen]);

  const handleProactiveMessageClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProactive(false);
    setProactiveClosed(true); // Stop showing proactive messages for this session
  };

  const handleStartSession = async (values: z.infer<typeof formSchema>, initialQuestion?: string) => {
    const action = isBusinessChat ? startBusinessChatSessionAction : startChatSessionAction;
    const params = isBusinessChat ? { ...values, businessId: businessId!, businessName: businessName! } : values;
    
    // @ts-ignore
    const result = await action(params);
    
    if ('isIndexError' in result && result.isIndexError) {
        sessionStorage.setItem('fullError', result.error || 'Unknown index error.');
        router.push('/errors');
        return;
    }

    if (result.success && result.sessionId) {
      setSessionId(result.sessionId);
      setMessages(result.history as ClientMessage[] || []);
      if (initialQuestion) {
        postInitialQuestion(result.sessionId, result.history as ClientMessage[] || [], initialQuestion);
      }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'No se pudo iniciar el chat. Por favor, inténtalo de nuevo.' });
    }
  };

  const postInitialQuestion = async (newSessionId: string, initialHistory: ClientMessage[], question: string) => {
     const userMessage: ClientMessage = { role: 'user', text: question };
     const newMessages = [...initialHistory, userMessage];
     setMessages(newMessages);
     setIsAiResponding(true);

     const action = isBusinessChat ? postBusinessMessageAction : postMessageAction;
     const params = { 
         sessionId: newSessionId, 
         message: userMessage.text, 
         history: initialHistory,
         ...(isBusinessChat && { businessId: businessId! })
     };

     // @ts-ignore
     const result = await action(params);
     
     if (result.success && result.response) {
       const aiMessage: ClientMessage = { role: 'model', text: result.response };
       setMessages((prev) => [...prev, aiMessage]);
     } else {
       toast({ variant: 'destructive', title: 'Error', description: result.error });
        const errorResponseMessage: ClientMessage = { role: 'model', text: 'Lo siento, he tenido un problema y no puedo responder ahora mismo.' };
       setMessages((prev) => [...prev, errorResponseMessage]);
     }
     setIsAiResponding(false);
  }
  
  const handleSuggestionClick = (question: string) => {
    form.handleSubmit((values) => handleStartSession(values, question))();
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !sessionId || isAiResponding) return;

    const userMessage: ClientMessage = { role: 'user', text: currentMessage.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentMessage('');
    setIsAiResponding(true);

    const action = isBusinessChat ? postBusinessMessageAction : postMessageAction;
    const params = { 
        sessionId, 
        message: userMessage.text, 
        history: messages,
        ...(isBusinessChat && { businessId: businessId! })
    };

    // @ts-ignore
    const result = await action(params);
    
    if (result.success && result.response) {
      const aiMessage: ClientMessage = { role: 'model', text: result.response };
      setMessages((prev) => [...prev, aiMessage]);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
       const errorResponseMessage: ClientMessage = { role: 'model', text: 'Lo siento, he tenido un problema y no puedo responder ahora mismo.' };
      setMessages((prev) => [...prev, errorResponseMessage]);
    }
    setIsAiResponding(false);
  };
  
  const renderWelcomeContent = () => {
    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
                <Card className="border-none shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {isBusinessChat ? <Building className="h-5 w-5 text-primary"/> : <Phone className="h-5 w-5 text-primary"/>}
                            {isBusinessChat ? `Asistente de ${businessName}` : "Contacto Directo"}
                        </CardTitle>
                        <CardDescription>
                            {isBusinessChat
                                ? `Hola, ¿listo para chatear con ${businessName}? Solo necesitamos unos datos para empezar.`
                                : 'Necesitamos unos datos para poder ayudarte mejor. Si ya has hablado con nosotros, usa el mismo teléfono para continuar la conversación.'
                            }
                        </CardDescription>
                         <div className="pt-4">
                            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground"><MessageSquareQuote className="h-4 w-4"/> O pregúntale directamente...</p>
                            <div className="flex flex-col gap-2">
                                {currentSuggestions.map((q, i) => (
                                    <Button 
                                        key={i} 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full text-left justify-start h-auto whitespace-normal animate-in fade-in duration-500" 
                                        onClick={() => handleSuggestionClick(q)}
                                    >
                                        {q}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 border-t">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit((values) => handleStartSession(values))} className="space-y-4">
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
                                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Iniciar Chat"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </ScrollArea>
        </div>
    )
  }

  const renderChatContent = () => {
    if (!sessionId) {
      return renderWelcomeContent();
    }

    return (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                 {msg.role === 'model' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Bot size={20} />
                    </div>
                )}
                <div className="flex flex-col gap-1 w-full max-w-lg">
                    <div className={cn('p-3 rounded-lg', msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900/50 ml-auto' : 'bg-gray-100 dark:bg-gray-800')}>
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                    </div>
                </div>
                 {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User size={20} />
                    </div>
                )}
              </div>
            ))}
            {isAiResponding && (
                <div className="flex items-end gap-2 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
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
          <form onSubmit={handleSendMessage} className="flex gap-2">
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

  // If embedded, we only render the main card content
  if (embedded) {
    return (
        <Card className="h-full flex flex-col shadow-2xl w-full border-primary">
             <CardHeader className="flex flex-row items-center justify-between">
                <div className='flex items-center gap-2'>
                    {isBusinessChat ? <Building className="h-6 w-6 text-primary" /> : <Sparkles className="h-6 w-6 text-primary" />}
                    <CardTitle className="font-headline text-lg">
                    {isBusinessChat ? `Asistente de ${businessName}` : "Asistente de Inmigración"}
                    </CardTitle>
                </div>
            </CardHeader>
           {isMounted ? renderChatContent() : <div className='flex-1 flex items-center justify-center'><Loader2 className='animate-spin'/></div>}
        </Card>
    )
  }

  return (
    <>
      {isMounted && !embedded && (
        <div className="fixed bottom-6 right-6 z-20">
            {showProactive && !isOpen && proactiveMessage && (
                <div className="absolute bottom-full right-0 mb-3 w-max max-w-[280px] animate-in fade-in-50 slide-in-from-bottom-2">
                    <div className="flex items-end gap-2">
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
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg z-10 -mr-2">
                            <Bot size={28} />
                        </div>
                    </div>
                </div>
            )}
            <Button
            onClick={() => setIsOpen(!isOpen)}
            className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center"
            size="icon"
            >
            {isOpen ? <X size={32} /> : <LuBotMessageSquare size={36} />}
            </Button>
        </div>
      )}

      <div
        className={cn(
          'fixed bottom-24 right-6 z-20 w-[calc(100%-3rem)] max-w-sm h-[70vh] max-h-[600px] origin-bottom-right transition-all duration-300 ease-in-out',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        )}
      >
        <Card className="h-full flex flex-col shadow-2xl">
           <CardHeader className="flex flex-row items-center justify-between">
              <div className='flex items-center gap-2'>
                 {isBusinessChat ? <Building className="h-6 w-6 text-primary" /> : <Sparkles className="h-6 w-6 text-primary" />}
                <CardTitle className="font-headline text-lg">
                  {isBusinessChat ? `Asistente de ${businessName}` : "Asistente de Inmigración"}
                </CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                  <X size={16}/>
              </Button>
            </CardHeader>
           {isMounted ? renderChatContent() : <div className='flex-1 flex items-center justify-center'><Loader2 className='animate-spin'/></div>}
        </Card>
      </div>
    </>
  );
}
