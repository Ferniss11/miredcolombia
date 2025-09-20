
'use client';

import { useState, useRef, useEffect, useCallback, useTransition, Fragment } from 'react';
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
import { X, Send, User, Bot, Loader2, Sparkles, Phone, Building, MessageSquareQuote, UserCog, Clock, RotateCcw, AlertCircle, Package, Paperclip, FileText, CheckCircle } from 'lucide-react';
import { LuBotMessageSquare } from "react-icons/lu";
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, ChatSession, UserRole } from '@/lib/chat-types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useChat } from '@/context/ChatContext';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';


// --- Welcome Form Sub-component ---
const signUpFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  email: z.string().email({ message: 'Debe ser un email válido.' }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.')
});

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

type WelcomeFormProps = {
  onSignUpSuccess: () => void;
  isBusinessChat: boolean;
  businessContext?: { businessId: string, businessName: string };
  onLoginClick: () => void;
}

const WelcomeForm = ({ onSignUpSuccess, isBusinessChat, businessContext, onLoginClick }: WelcomeFormProps) => {
    const { signUpWithEmail } = useAuth();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpFormSchema),
        defaultValues: { name: '', email: '', password: '' },
    });

    const handleFormSubmit = async (values: SignUpFormValues) => {
        startTransition(async () => {
             const { error } = await signUpWithEmail(values.name, values.email, values.password, 'User');
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Has iniciado sesión exitosamente.' });
                // The onSignUpSuccess callback is now crucial. It will trigger the
                // startSessionForUser function in the parent, which now correctly
                // handles session creation for the newly logged-in user.
                onSignUpSuccess();
            }
        });
    };
    
    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col h-full p-4">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    {isBusinessChat ? <Building className="h-5 w-5 text-primary"/> : <Phone className="h-5 w-5 text-primary"/>}
                    <h3 className="font-bold font-headline">{isBusinessChat ? `Asistente de ${businessContext?.businessName}` : "Valeria"}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Para empezar, crea una cuenta gratuita. Esto nos permite guardar tu conversación y darte un mejor servicio.
                </p>
                 <Button variant="link" size="sm" className="p-0 mt-2" onClick={onLoginClick}>¿Ya tienes una cuenta? Inicia sesión</Button>
            </div>
            
            <div className="pt-6 border-t mt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input placeholder="tu@email.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />
                         <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : "Crear Cuenta y Chatear"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
      </ScrollArea>
    )
}

// --- Login Form Sub-component ---
const loginFormSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});
const LoginForm = ({ onLoginSuccess, onBackClick }: { onLoginSuccess: () => void, onBackClick: () => void }) => {
    const { loginWithEmail } = useAuth();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof loginFormSchema>>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: { email: '', password: '' },
    });
    
    const handleLoginSubmit = async (values: z.infer<typeof loginFormSchema>) => {
        startTransition(async () => {
            const { error } = await loginWithEmail(values.email, values.password);
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Inicio de Sesión', description: 'Credenciales inválidas.' });
            } else {
                toast({ title: '¡Bienvenido de vuelta!' });
                onLoginSuccess();
            }
        });
    };

    return (
        <div className="p-4">
             <h3 className="font-bold font-headline">Inicia Sesión</h3>
             <p className="text-sm text-muted-foreground mb-4">Introduce tus credenciales para continuar.</p>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="space-y-4">
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field}/></FormControl><FormMessage /></FormItem>)}/>
                    <div className="flex gap-2">
                        <Button variant="outline" type="button" onClick={onBackClick}>Atrás</Button>
                        <Button type="submit" className="flex-1" disabled={isPending}>
                            {isPending && <Loader2 className="animate-spin mr-2"/>} Iniciar Sesión
                        </Button>
                    </div>
                </form>
             </Form>
        </div>
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

const getShuffledSample = (arr: string[], count: number) => {
    return arr.sort(() => 0.5 - Math.random()).slice(0, count);
}

const AGENT_AVATAR_URL = "https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FImagen%20de%20WhatsApp%202025-08-09%20a%20las%2018.20.39_3c2b6161.jpg?alt=media&token=41ebe34a-f846-41fc-937f-4141f1240ee8";


interface ChatWidgetProps {
    isLabMode?: boolean;
    labConfig?: {
        agentId: 'global' | 'valeria_premium';
        sessionId: string;
    };
    onReset?: () => void;
    onMessageReceived?: (message: ChatMessage) => void;
    initialHistory?: ChatMessage[];
}


export default function ChatWidget({ isLabMode = false, labConfig, onReset, onMessageReceived, initialHistory = [] }: ChatWidgetProps) {
  const { 
    isChatOpen, 
    setChatOpen, 
    chatContext, 
    isChatVisible 
  } = useChat();

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  
  const [proactiveMessage, setProactiveMessage] = useState('');
  const [showProactive, setShowProactive] = useState(false);
  const [proactiveClosed, setProactiveClosed] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  
  const [view, setView] = useState<'welcome' | 'login' | 'chat'>('chat');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, claims, userProfile, loading: authLoading } = useAuth();
  
  const isPremiumUser = claims?.valeria_plan === 'valeria_premium';
  const isInDashboard = pathname.startsWith('/dashboard/valeria');

  const isBusinessChat = !!chatContext?.businessId;
  const suggestionPool = isBusinessChat ? allBusinessQuestions : allGeneralQuestions;
  const proactivePool = isBusinessChat ? businessProactiveMessages : migrationProactiveMessages;

  const handleSessionStarted = useCallback((newSession: ChatSession, history: ChatMessage[]) => {
    setSession(newSession);
    setMessages(history);
    setView('chat');
  }, []);

  const startSessionForUser = useCallback(async () => {
    if (!user || !userProfile) return;
    
    try {
        const response = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}`},
            body: JSON.stringify({
                 userId: user.uid,
                userName: userProfile.name,
                userPhone: userProfile.businessProfile?.phone,
                userEmail: userProfile.email,
                businessId: chatContext?.businessId
            }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message);

        handleSessionStarted(result.session, result.history);
        
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'No se pudo iniciar tu sesión de chat.';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage});
    }
  }, [user, userProfile, chatContext, handleSessionStarted, toast]);

  useEffect(() => {
    if (!isLabMode) {
      if (!authLoading && (isChatOpen || isInDashboard)) {
          if (user && userProfile && !session) {
              startSessionForUser();
          } else if (!user && view === 'chat') {
              setSession(null);
              setMessages([]);
              setView('welcome');
          }
      }
    }
  }, [user, userProfile, session, isChatOpen, isInDashboard, startSessionForUser, view, authLoading, isLabMode]);
  
  // Effect for lab mode session management
  useEffect(() => {
    if (isLabMode && labConfig) {
        setSession({ id: labConfig.sessionId } as ChatSession);
        setMessages(initialHistory); // Use initialHistory from props
        setView('chat');
        setSuggestions(getShuffledSample(suggestionPool, 3));
    }
  }, [isLabMode, labConfig, suggestionPool, initialHistory])


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
      if (!isMounted || isChatOpen || proactiveClosed || showProactive || isLabMode) return;
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
  }, [isMounted, isChatOpen, proactiveClosed, proactivePool, showProactive, isLabMode]);
  
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
      if((isChatOpen || isLabMode) && !session) {
        setSuggestions(getShuffledSample(suggestionPool, 3));
      }
  }, [isChatOpen, isLabMode, session, suggestionPool]);
  
  const handleSendMessage = async (messageText: string, file?: File | null) => {
    const effectiveSessionId = isLabMode ? labConfig?.sessionId : session?.id;

    if ((!messageText.trim() && !file) || isAiResponding || !effectiveSessionId) return;

    if (!isLabMode) {
      const currentMessageCount = session?.messageCount || 0;
      if (!isPremiumUser && currentMessageCount >= 3) {
          toast({ title: 'Límite Gratuito Alcanzado', description: 'Actualiza a un plan premium para continuar.', variant: 'destructive' });
          return;
      }
    }
    
    setIsAiResponding(true);
    setCurrentMessage('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const formData = new FormData();
    formData.append('currentMessage', messageText.trim());
    if (file) {
      formData.append('document', file);
    }
    
    const endpoint = `/api/chat/sessions/${effectiveSessionId}/messages`;
    let headers: HeadersInit = {};
    const idToken = await user?.getIdToken();

    if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
    }

    if (isLabMode && labConfig) {
        formData.append('agentId', labConfig.agentId);
    } else if (chatContext?.businessId) {
        formData.append('businessId', chatContext.businessId);
    }
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: formData,
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'Error en el servidor');

        // The API now returns the full history. Let's use it as the source of truth.
        setMessages(result.history || []);
        
        // Find the last message (which should be the AI response) to pass to the callback.
        if (result.history && result.history.length > 0) {
            onMessageReceived?.(result.history[result.history.length - 1]);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        if (errorMessage.includes("<!DOCTYPE")) {
            toast({ variant: 'destructive', title: 'Error de Comunicación', description: 'La respuesta del servidor no fue válida. Inténtalo de nuevo.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        }
    } finally {
        setIsAiResponding(false);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) { // 10 MB limit
            toast({ variant: 'destructive', title: 'Archivo Demasiado Grande', description: 'El tamaño máximo del archivo es 10MB.' });
            return;
        }
        setAttachedFile(file);
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage(currentMessage, attachedFile);
  }
  
  const handleProactiveMessageClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProactive(false);
    setProactiveClosed(true);
  };
  
  const handleReset = () => {
    if (onReset) onReset(); // For lab mode
    else {
        setSession(null);
        setMessages([]);
        if (user) startSessionForUser();
        else setView('welcome');
    }
  }

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  const renderChatContent = () => {
    if (isInDashboard && !isLabMode && (!session || !userProfile)) {
        return <div className='flex-1 flex items-center justify-center'><Loader2 className='animate-spin h-8 w-8'/></div>
    }

    if (!isLabMode && !session) {
        if (view === 'login') return <LoginForm onLoginSuccess={startSessionForUser} onBackClick={() => setView('welcome')} />;
        return <WelcomeForm onSignUpSuccess={startSessionForUser} isBusinessChat={isBusinessChat} businessContext={chatContext || undefined} onLoginClick={() => setView('login')} />;
    }

    const isLimitReached = !isLabMode && !isPremiumUser && (session?.messageCount || 0) >= 3;
    const canUploadFile = isLabMode ? labConfig?.agentId === 'valeria_premium' : isPremiumUser;


    return (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => {
              // --- File Message Card ---
              if (msg.file) {
                 const { status, name } = msg.file;
                 let icon = <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />;
                 let statusText = 'Procesando documento...';
                 if (status === 'ready') {
                    icon = <CheckCircle className="h-5 w-5 text-green-500" />;
                    statusText = 'Documento listo para consulta.';
                 }
                 return (
                    <div key={msg.id} className="flex justify-end">
                       <div className="p-3 rounded-lg shadow-sm bg-primary text-primary-foreground max-w-lg w-fit ml-auto rounded-br-none">
                           <div className="flex items-center gap-3">
                              <FileText className="h-6 w-6"/>
                              <div className="overflow-hidden">
                                  <p className="text-sm font-semibold truncate">{name}</p>
                                  <div className="flex items-center gap-1.5 text-xs opacity-90">
                                      {icon}
                                      <span>{statusText}</span>
                                  </div>
                              </div>
                           </div>
                       </div>
                    </div>
                 );
              }
              // --- Regular Text Message ---
              const isUser = msg.role === 'user';
              const isAdmin = msg.role === 'admin';
              const isModel = msg.role === 'model';
              const alignment = isUser ? 'justify-end' : 'justify-start';
              const bgColor = isUser ? 'bg-primary text-primary-foreground' : isAdmin ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-muted';
              const avatar = isUser ? (<Avatar className="w-8 h-8 flex-shrink-0"><AvatarFallback className="bg-muted"><User size={18} /></AvatarFallback></Avatar>) 
                                     : (<Avatar className="w-8 h-8 flex-shrink-0">{!isBusinessChat ? (<AvatarImage src={AGENT_AVATAR_URL} alt="Avatar de Valeria" className="object-cover" />) : (<AvatarFallback className={cn(isAdmin ? 'bg-yellow-400 text-black' : 'bg-primary/10 text-primary')}>{isAdmin ? <UserCog size={18} /> : <Bot size={18} />}</AvatarFallback>)}</Avatar>);
              const authorName = isAdmin ? (msg.authorName || 'Admin') : isModel ? 'Valeria' : '';

              return (
                <div key={msg.id || index} className={cn("flex items-end gap-2 w-full", alignment)}>
                   {!isUser && avatar}
                    <div className="flex flex-col gap-1 w-full max-w-lg">
                        {authorName && <span className={cn("text-xs text-muted-foreground", isUser ? 'text-right' : 'text-left')}>{authorName}</span>}
                        <div className={cn('p-3 rounded-lg shadow-sm w-fit', bgColor, isUser ? 'ml-auto rounded-br-none' : 'mr-auto rounded-bl-none')}>
                            <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: (msg.text || '').replace(/\\n/g, '<br />') }} />
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
             {messages.length === 0 && (
                <div className="pt-4 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><MessageSquareQuote className="h-4 w-4"/> O pregúntale directamente...</p>
                    {suggestions.map((q, i) => (
                        <Button key={i} variant="outline" size="sm" className="w-full text-left justify-start h-auto whitespace-normal" onClick={() => handleSendMessage(q)} disabled={isAiResponding}>{q}</Button>
                    ))}
                </div>
            )}
            {isAiResponding && (
                <div className="flex items-end gap-2 justify-start">
                    <Avatar className="w-8 h-8 flex-shrink-0">{!isBusinessChat ? (<AvatarImage src={AGENT_AVATAR_URL} alt="Avatar de Valeria" className="object-cover" />) : (<AvatarFallback className='bg-primary/10 text-primary'><Bot size={18} /></AvatarFallback>)}</Avatar>
                    <div className="bg-muted rounded-xl px-4 py-3 rounded-bl-none flex items-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span className="text-sm text-muted-foreground">Escribiendo...</span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background rounded-b-lg">
            {isLimitReached ? (
                 <Alert><Package className="h-4 w-4" /><AlertTitle>Límite Gratuito Alcanzado</AlertTitle><AlertDescription className="flex flex-col gap-2">Has usado tus 3 mensajes gratis. ¡Actualiza tu plan para seguir chateando con Valeria!<Button asChild size="sm"><Link href="/valeria">Ver Planes de Valeria</Link></Button></AlertDescription></Alert>
            ) : (
                <>
                {attachedFile && (
                    <div className="relative flex items-center gap-2 p-2 mb-2 border rounded-lg bg-muted">
                        <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground truncate flex-grow">{attachedFile.name}</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => {
                                setAttachedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                 <form onSubmit={handleFormSubmit} className="flex gap-2">
                    <Input value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Escribe tu pregunta..." disabled={isAiResponding || isLimitReached} autoComplete="off" />
                    {canUploadFile && <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isAiResponding}><Paperclip className="h-5 w-5"/></Button>}
                    <Button type="submit" size="icon" disabled={isAiResponding || (!currentMessage.trim() && !attachedFile) || isLimitReached}><Send size={18} /></Button>
                    <Input type="file" className="hidden" ref={fileInputRef} accept=".pdf,.txt,.md" onChange={handleFileChange} />
                </form>
                </>
            )}
        </div>
      </div>
    );
  };
  
  if (isInDashboard || isLabMode) {
      return renderChatContent();
  }

  if (!isChatVisible) {
    return null;
  }

  return (
    <Fragment>
      {isMounted && (
        <TooltipProvider>
        <div className="fixed bottom-6 right-6 z-50">
            {showProactive && !isChatOpen && proactiveMessage && (
                <div className="absolute bottom-full right-0 mb-3 w-max max-w-[280px] animate-in fade-in-50 slide-in-from-bottom-2">
                    <div className="flex items-end gap-2">
                        <Avatar className="w-12 h-12 flex-shrink-0 z-10 -mr-2 shadow-lg border-2 border-background">
                            <AvatarImage src={AGENT_AVATAR_URL} alt="Avatar de Valeria" className="object-cover" />
                             <AvatarFallback className="bg-primary text-primary-foreground"><LuBotMessageSquare size={20} /></AvatarFallback>
                        </Avatar>
                         <div className="relative bg-background dark:bg-card shadow-lg rounded-lg p-3 text-sm group">
                            <p>{proactiveMessage}</p>
                            <div className="absolute right-3 -bottom-1.5 w-3 h-3 bg-background dark:bg-card transform rotate-45"></div>
                            <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleProactiveMessageClose}><X className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
            )}
             <Sheet open={isChatOpen} onOpenChange={setChatOpen}>
                <SheetTrigger asChild>
                     <Button className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center p-0" size="icon" id="global-chat-trigger">
                       {isChatOpen ? <X size={32} /> : 
                       <Avatar className="w-full h-full">
                           <AvatarImage src={AGENT_AVATAR_URL} alt="Avatar de Valeria, asistente IA" className="object-cover" />
                           <AvatarFallback><Bot size={40}/></AvatarFallback>
                       </Avatar>}
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full" side="right">
                    <SheetHeader className="p-4 border-b flex-row items-center justify-between">
                        <SheetTitle className="flex items-center gap-2 font-headline text-lg">
                            {isBusinessChat ? <Building className="h-6 w-6 text-primary" /> : (<Avatar className="w-8 h-8"><AvatarImage src={AGENT_AVATAR_URL} alt="Avatar de Valeria" className="object-cover"/><AvatarFallback><Sparkles className="h-4 w-4"/></AvatarFallback></Avatar>)}
                            {isBusinessChat ? `Asistente de ${chatContext.businessName}` : "Valeria"}
                        </SheetTitle>
                        {(session || isLabMode) && (<Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}><RotateCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Empezar de nuevo</p></TooltipContent></Tooltip>)}
                    </SheetHeader>
                    <div className="flex-1 min-h-0">
                      {isMounted ? renderChatContent() : <div className='flex-1 flex items-center justify-center'><Loader2 className='animate-spin'/></div>}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
        </TooltipProvider>
      )}
    </Fragment>
  );
}
