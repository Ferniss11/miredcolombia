
'use client';

import { useState, useRef, useEffect, useCallback, useTransition, Fragment } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, User, Bot, Loader2, Sparkles, Phone, Building, MessageSquareQuote, UserCog, Clock, RotateCcw, Package, Paperclip, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, ChatSession, AgentConfig, ValeriaPlan } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useChat } from '@/context/ChatContext';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { useAuth } from '@/context/AuthContext';
import { Progress } from '../ui/progress';
import { createSubscriptionCheckoutSessionAction } from "@/lib/payment-actions";

// --- Welcome Form Sub-component ---
const signUpFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  email: z.string().email({ message: 'Debe ser un email válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});
type SignUpFormValues = z.infer<typeof signUpFormSchema>;

const WelcomeForm = ({ onSignUpSuccess, onLoginClick }: { onSignUpSuccess: () => void, onLoginClick: () => void }) => {
    const { signUpWithEmail } = useAuth();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpFormSchema),
        defaultValues: { name: '', email: '', password: '' },
    });

    const handleFormSubmit = (values: SignUpFormValues) => {
        startTransition(async () => {
             const { error } = await signUpWithEmail(values.name, values.email, values.password, 'User');
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Has iniciado sesión exitosamente.' });
                onSignUpSuccess();
            }
        });
    };
    
    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col h-full p-4">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-5 w-5 text-primary"/>
                    <h3 className="font-bold font-headline">Valeria</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Para empezar, crea una cuenta gratuita. Esto nos permite guardar tu conversación y darte un mejor servicio.
                </p>
                 <Button variant="link" size="sm" className="p-0 mt-2" onClick={onLoginClick}>¿Ya tienes una cuenta? Inicia sesión</Button>
            </div>
            <div className="pt-6 border-t mt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <Button type="submit" className="w-full" disabled={isPending}>{isPending ? <Loader2 className="animate-spin" /> : "Crear Cuenta y Chatear"}</Button>
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
    
    const handleLoginSubmit = (values: z.infer<typeof loginFormSchema>) => {
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
                        <Button type="submit" className="flex-1" disabled={isPending}>{isPending && <Loader2 className="animate-spin mr-2"/>} Iniciar Sesión</Button>
                    </div>
                </form>
             </Form>
        </div>
    )
}

// --- File Message Sub-component ---
const FileMessage = ({ file, progress }: { file: NonNullable<ChatMessage['file']>, progress: number }) => {
  const isProcessing = file.status === 'processing';
  return (
    <div className="bg-muted p-3 rounded-lg flex items-center gap-3 w-full max-w-lg">
      <FileText className="h-6 w-6 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          {isProcessing ? (
            <Progress value={progress} className="h-1.5 flex-1" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <span className="text-xs text-muted-foreground">
            {isProcessing ? `${Math.round(progress)}% - Procesando...` : 'Documento listo'}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Upgrade CTA Button ---
const UpgradeButton = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleUpgrade = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para actualizar.' });
            return;
        }
        startTransition(async () => {
            const result = await createSubscriptionCheckoutSessionAction({
                planId: 'valeria_premium',
                userId: user.uid,
                userEmail: user.email!,
            });
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            }
        });
    }

    return (
        <Button onClick={handleUpgrade} disabled={isPending} size="sm" className="mt-2 w-full">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Actualizar a Premium por 4,99€/mes
        </Button>
    )
}


// --- Main Chat Widget Component ---
const AGENT_AVATAR_URL = "https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FImagen%20de%20WhatsApp%202025-08-09%20a%20las%2018.20.39_3c2b6161.jpg?alt=media&token=41ebe34a-f846-41fc-937f-4141f1240ee8";

interface ChatWidgetProps {
    isLabMode?: boolean;
    labConfig?: { agentId: 'global' | 'valeria_premium' | 'business'; sessionId: string };
    initialHistory?: ChatMessage[];
    onReset?: () => void;
    onMessageReceived?: (message: ChatMessage & { agentConfig?: AgentConfig }) => void;
    isInline?: boolean; // New prop for inline mode
}

export default function ChatWidget({ isLabMode = false, labConfig, initialHistory = [], onReset, onMessageReceived, isInline = false }: ChatWidgetProps) {
  const { isChatOpen, setChatOpen, chatContext, isChatVisible } = useChat();
  const { toast } = useToast();
  const { user, userProfile, claims, loading: authLoading } = useAuth();
  const pathname = usePathname();
  
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [view, setView] = useState<'loading' | 'welcome' | 'login' | 'chat'>('loading');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPremiumUser = claims?.valeria_plan === 'valeria_premium';
  
  const isChatActive = isInline || isChatOpen;
  
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
             scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const startSessionForUser = useCallback(async (firebaseUser, profile) => {
    setView('loading');
    try {
        const response = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await firebaseUser.getIdToken()}` },
            body: JSON.stringify({
                userId: firebaseUser.uid,
                userName: profile.name,
                userPhone: profile.businessProfile?.phone || '',
                userEmail: profile.email,
                businessId: chatContext?.businessId
            }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message);

        setSession(result.session);
        setMessages(result.history);
        setView('chat');
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'No se pudo iniciar tu sesión de chat.';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        setView('welcome');
    }
  }, [chatContext, toast]);


  useEffect(() => {
    if (isLabMode) {
      setMessages(initialHistory);
      setView('chat');
      if (labConfig?.sessionId && (!session || session.id !== labConfig.sessionId)) {
          setSession({id: labConfig.sessionId} as ChatSession);
      }
      return;
    }
    
    if (authLoading && isChatActive) {
        setView('loading');
        return;
    }
    
    if (isChatActive) {
        if (user && userProfile) {
            if (!session || session.userId !== user.uid) {
                startSessionForUser(user, userProfile);
            } else {
                setView('chat');
            }
        } else {
            if(view !== 'welcome' && view !== 'login') {
                setSession(null);
                setMessages([]);
                setView('welcome');
            }
        }
    }

  }, [user, userProfile, authLoading, isChatActive, isLabMode, initialHistory, session, startSessionForUser, view, labConfig?.sessionId]);

  const handleSendMessage = async (messageText: string, file?: File | null) => {
    const activeSessionId = isLabMode ? labConfig?.sessionId : session?.id;
    if ((!messageText.trim() && !file) || isAiResponding || !activeSessionId) return;

    const isLimitReached = !isPremiumUser && messages.filter(m => m.role === 'user').length >= 3;
    if (isLabMode ? (labConfig?.agentId === 'global' && isLimitReached) : isLimitReached) {
        toast({ title: 'Límite Gratuito Alcanzado', description: 'Actualiza a un plan premium para continuar.', variant: 'destructive' });
        return;
    }
    
    let userMessageText = messageText.trim();
    const tempUserMessageId = `temp_user_${Date.now()}`;
    const optimisticUserMessage: ChatMessage = {
      id: tempUserMessageId,
      text: userMessageText,
      role: 'user',
      timestamp: new Date().toISOString(),
      replyTo: null,
    };

    if (file) {
      optimisticUserMessage.file = { name: file.name, status: 'processing', progress: 0 };
    }
    
    setMessages(prev => [...prev, optimisticUserMessage]);
    setCurrentMessage('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    if (file) {
        setUploadProgress(0);
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        setTimeout(() => clearInterval(progressInterval), 2000);
    }
    
    setIsAiResponding(true);

    const formData = new FormData();
    formData.append('currentMessage', userMessageText);
    if (file) formData.append('document', file);
    
    const apiPath = new URL(`${window.location.origin}/api/chat/sessions/${activeSessionId}/messages`);
    
    if (chatContext?.businessId) apiPath.searchParams.append('businessId', chatContext.businessId);
    if (isLabMode && labConfig?.agentId) apiPath.searchParams.append('agentId', labConfig.agentId);

    try {
        const idToken = await user?.getIdToken();
        const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

        const response = await fetch(apiPath.toString(), {
            method: 'POST',
            headers,
            body: formData,
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'Error en el servidor');
        
        // Finalize progress for file upload message
        if (file) {
            setMessages(prev => prev.map(msg => 
                msg.id === tempUserMessageId && msg.file
                    ? { ...msg, text: `He adjuntado el documento: ${file.name}`, file: { ...msg.file, status: 'ready', progress: 100 } }
                    : msg
            ));
            toast({ title: "Documento procesado", description: "Valeria ahora puede acceder a la información de tu archivo." });
        }
        
        setMessages(result.history || []);
        if (isLabMode && onMessageReceived && result.lastResponse) {
             onMessageReceived(result.lastResponse);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        setMessages(prev => prev.filter(m => m.id !== tempUserMessageId));
    } finally {
        setIsAiResponding(false);
        setUploadProgress(100);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage(currentMessage, attachedFile);
  }

  const renderChatContent = () => {
    switch (view) {
        case 'loading':
            return <div className='flex-1 flex items-center justify-center'><Loader2 className='animate-spin h-8 w-8'/></div>;
        case 'welcome':
            return <WelcomeForm onSignUpSuccess={() => {}} onLoginClick={() => setView('login')} />;
        case 'login':
            return <LoginForm onLoginSuccess={() => {}} onBackClick={() => setView('welcome')} />;
        case 'chat':
          const isUserMessageLimitReached = !isPremiumUser && messages.filter(m => m.role === 'user').length >= 3;
          const isLimitReached = isLabMode ? (labConfig?.agentId === 'global' && isUserMessageLimitReached) : isUserMessageLimitReached;

          const canUploadFile = isPremiumUser || isLabMode;

          return (
            <div className="flex flex-col h-full">
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const avatar = isUser ? (<Avatar className="w-8 h-8 flex-shrink-0"><AvatarFallback className="bg-muted"><User size={18} /></AvatarFallback></Avatar>) 
                                           : (<Avatar className="w-8 h-8 flex-shrink-0"><AvatarImage src={AGENT_AVATAR_URL} alt="Avatar de Valeria" className="object-cover" /><AvatarFallback><Sparkles className="h-4 w-4"/></AvatarFallback></Avatar>);

                    return (
                        <div key={msg.id || index} className={cn("flex items-end gap-2 w-full", isUser ? 'justify-end' : 'justify-start')}>
                           {!isUser && avatar}
                            <div className="flex flex-col gap-1 w-full max-w-lg">
                                {msg.file ? (
                                    <FileMessage file={msg.file} progress={uploadProgress} />
                                ) : (
                                    <div className={cn('p-3 rounded-lg shadow-sm w-fit', isUser ? 'bg-primary text-primary-foreground ml-auto rounded-br-none' : 'bg-muted mr-auto rounded-bl-none')}>
                                        <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: (msg.text || '').replace(/\\n/g, '<br />') }} />
                                    </div>
                                )}
                            </div>
                            {isUser && avatar}
                        </div>
                    );
                  })}
                  {isAiResponding && (
                      <div className="flex items-end gap-2 justify-start">
                          <Avatar className="w-8 h-8 flex-shrink-0"><AvatarImage src={AGENT_AVATAR_URL} alt="Avatar de Valeria" className="object-cover"/><AvatarFallback><Sparkles className="h-4 w-4"/></AvatarFallback></Avatar>
                          <div className="bg-muted rounded-xl px-4 py-3 rounded-bl-none flex items-center gap-2">
                              <Loader2 className="animate-spin h-4 w-4" />
                          </div>
                      </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-background rounded-b-lg">
                  {isLimitReached ? (
                       <Alert className="border-primary/50 bg-primary/10">
                           <Sparkles className="h-4 w-4 text-primary" />
                           <AlertTitle className="font-bold">Límite Gratuito Alcanzado</AlertTitle>
                           <AlertDescription>
                               Has usado tus 3 mensajes gratis. ¡Actualiza para continuar chateando!
                               <UpgradeButton />
                           </AlertDescription>
                       </Alert>
                  ) : (
                      <>
                      {attachedFile && (
                          <div className="relative flex items-center gap-2 p-2 mb-2 border rounded-lg bg-muted">
                              <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground truncate flex-grow">{attachedFile.name}</p>
                              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => setAttachedFile(null)}><X className="h-4 w-4" /></Button>
                          </div>
                      )}
                       <form onSubmit={handleFormSubmit} className="flex gap-2">
                          <Input value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Escribe tu pregunta..." disabled={isAiResponding} autoComplete="off" />
                          {canUploadFile && <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isAiResponding}><Paperclip className="h-5 w-5"/></Button>}
                          <Button type="submit" size="icon" disabled={isAiResponding || (!currentMessage.trim() && !attachedFile)}><Send size={18} /></Button>
                          <Input type="file" className="hidden" ref={fileInputRef} accept=".pdf,.txt,.md" onChange={(e) => e.target.files && setAttachedFile(e.target.files[0])} />
                      </form>
                      </>
                  )}
              </div>
            </div>
          );
    }
  };
  
  if (isInline) {
      return (
        <div className="h-full flex flex-col">
            {renderChatContent()}
        </div>
      )
  }

  if (isLabMode) {
      return (
        <div className="h-full flex flex-col">
            {renderChatContent()}
        </div>
      )
  }

  if (!isChatVisible) {
    return null;
  }

  return (
    <Sheet open={isChatOpen} onOpenChange={setChatOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center p-0" size="icon" id="global-chat-trigger">
          <Avatar className="w-full h-full"><AvatarImage src={AGENT_AVATAR_URL} alt="Avatar de Valeria, asistente IA" className="object-cover" /><AvatarFallback><Bot size={40}/></AvatarFallback></Avatar>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full" side="right">
          <SheetHeader className="p-4 border-b flex-row items-center justify-between">
              <SheetTitle className="flex items-center gap-2 font-headline text-lg">
                  <Avatar className="w-8 h-8"><AvatarImage src={AGENT_AVATAR_URL} alt="Avatar de Valeria" className="object-cover"/><AvatarFallback><Sparkles className="h-4 w-4"/></AvatarFallback></Avatar>
                  Valeria
              </SheetTitle>
              {session && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSession(null); setView('loading')}}><RotateCcw className="h-4 w-4" /></Button>)}
          </SheetHeader>
          <div className="flex-1 min-h-0">
            {renderChatContent()}
          </div>
      </SheetContent>
    </Sheet>
  );
}
