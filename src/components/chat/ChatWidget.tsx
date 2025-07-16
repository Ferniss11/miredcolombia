
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { MessageCircle, X, Send, User, Bot, Loader2, Sparkles, Phone, Building } from 'lucide-react';
import Link from 'next/link';
import { startChatSessionAction, postMessageAction } from '@/lib/chat-actions';
import { startBusinessChatSessionAction, postBusinessMessageAction } from '@/lib/business-chat-actions';
import { useToast } from '@/hooks/use-toast';

type ClientMessage = {
    role: 'user' | 'model';
    text: string;
};

type ChatWidgetProps = {
  businessId?: string;
};

const formSchema = z.object({
  userName: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  userPhone: z.string().min(7, { message: 'El teléfono es obligatorio.' }),
  acceptTerms: z.boolean().refine((data) => data === true, {
    message: 'Debes aceptar los términos y condiciones.',
  }),
});

export default function ChatWidget({ businessId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isBusinessChat = !!businessId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { userName: '', userPhone: '', acceptTerms: false },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleStartSession = async (values: z.infer<typeof formSchema>) => {
    const action = isBusinessChat ? startBusinessChatSessionAction : startChatSessionAction;
    const params = isBusinessChat ? { ...values, businessId: businessId! } : values;
    
    // @ts-ignore
    const result = await action(params);
    
    if (result.isIndexError) {
        sessionStorage.setItem('fullError', result.error || 'Unknown index error.');
        router.push('/errors');
        return;
    }

    if (result.success && result.sessionId) {
      setSessionId(result.sessionId);
      setMessages(result.history || []);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'No se pudo iniciar el chat. Por favor, inténtalo de nuevo.' });
    }
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

  const renderChatContent = () => {
    if (!sessionId) {
      return (
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                {isBusinessChat ? <Building className="h-5 w-5 text-primary"/> : <Phone className="h-5 w-5 text-primary"/>}
                {isBusinessChat ? "Asistente del Negocio" : "Contacto Directo"}
            </CardTitle>
            <CardDescription>
                Necesitamos unos datos para poder ayudarte mejor. Si ya has hablado con nosotros, usa el mismo teléfono para continuar la conversación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleStartSession)} className="space-y-4">
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
      );
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

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg z-20"
        size="icon"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </Button>
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
                  {isBusinessChat ? "Asistente del Negocio" : "Asistente de Inmigración"}
                </CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                  <X size={16}/>
              </Button>
            </CardHeader>
          {renderChatContent()}
        </Card>
      </div>
    </>
  );
}
