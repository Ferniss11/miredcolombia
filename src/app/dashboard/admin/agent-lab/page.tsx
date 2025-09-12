
'use client';

import React, { useState, useEffect, useCallback, FormEvent, KeyboardEvent, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, User, Send, Loader2, TestTube2, RotateCcw, BrainCircuit, FileUp, X, Paperclip } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

type AgentId = 'global' | 'valeria_premium' | 'business';

const AGENT_AVATAR_URL = "https://firebasestorage.googleapis.com/v0/b/colombia-en-esp.firebasestorage.app/o/web%2FImagen%20de%20WhatsApp%202025-08-09%20a%20las%2018.20.39_3c2b6161.jpg?alt=media&token=41ebe34a-f846-41fc-937f-4141f1240ee8";


interface SimulatedMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export default function AgentLabPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('global');
  const [isResponding, setIsResponding] = useState(false);
  const [messages, setMessages] = useState<SimulatedMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [contextFile, setContextFile] = useState<File | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!currentMessage.trim() || isResponding || !user) return;
    
    setIsResponding(true);
    const userMessageText = currentMessage;
    setCurrentMessage('');

    const userMessage: SimulatedMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userMessageText,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
        const idToken = await user.getIdToken();
        const formData = new FormData();
        formData.append('agentId', selectedAgent);
        formData.append('currentMessage', userMessageText);
        formData.append('chatHistory', JSON.stringify(messages));
        if (contextFile) {
            formData.append('contextFile', contextFile);
        }

        const response = await fetch('/api/agent-lab/chat', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` },
            body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error?.message || 'Error del servidor');
        }

        const aiMessage: SimulatedMessage = {
            id: `model-${Date.now()}`,
            role: 'model',
            text: result.response, // The actual text response is now nested
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({ variant: 'destructive', title: 'Error en la Simulación', description: errorMessage });
        setMessages(prev => prev.filter(m => m.id !== userMessage.id)); // Rollback optimistic update
    } finally {
        setIsResponding(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  }
  
  const handleResetSession = () => {
    setMessages([]);
    setCurrentMessage('');
    setContextFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };
  
   const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.type !== 'application/pdf') {
            toast({ variant: 'destructive', title: 'Formato no válido', description: 'Por favor, sube solo archivos PDF.' });
            return;
        }
        setContextFile(file);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <TestTube2 className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Laboratorio de Agentes IA</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel - Main Chat */}
        <div className="lg:col-span-8">
             <Card className="h-[calc(100vh-12rem)] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Simulador de Chat</CardTitle>
                        <CardDescription>Interactúa con el agente seleccionado.</CardDescription>
                    </div>
                     <Button variant="ghost" size="icon" onClick={handleResetSession}>
                        <RotateCcw className="h-4 w-4"/>
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                     <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                             {messages.length === 0 && (
                                <div className="text-center py-16 text-muted-foreground">
                                    <p>La conversación está vacía. Selecciona un agente y envía un mensaje para empezar.</p>
                                </div>
                            )}
                            {messages.map((msg) => {
                                const isUser = msg.role === 'user';
                                const alignment = isUser ? 'justify-end' : 'justify-start';
                                const bgColor = isUser ? 'bg-primary text-primary-foreground' : 'bg-muted';
                                const avatar = isUser ? <User size={18} /> : <Bot size={18}/>;

                                 return (
                                    <div key={msg.id} className={cn("group flex items-end gap-2 w-full", alignment)}>
                                    {!isUser && <Avatar className="w-8 h-8 flex-shrink-0"><AvatarFallback className="bg-primary/10"><Bot size={18} /></AvatarFallback></Avatar>}
                                        <div className="flex flex-col gap-1 w-full max-w-lg">
                                            <div className={cn('p-3 rounded-lg shadow-sm w-fit', bgColor, isUser ? 'ml-auto rounded-br-none' : 'mr-auto rounded-bl-none')}>
                                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                            </div>
                                            <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground pr-2", isUser && "justify-end")}>
                                                <Clock className="h-3 w-3" />
                                                <span>{formatTimestamp(msg.timestamp)}</span>
                                            </div>
                                        </div>
                                    {isUser && <Avatar className="w-8 h-8 flex-shrink-0"><AvatarFallback><User size={18} /></AvatarFallback></Avatar>}
                                    </div>
                                )
                            })}
                              {isResponding && (
                                <div className="flex items-end gap-2 justify-start">
                                     <Avatar className="w-8 h-8 flex-shrink-0"><AvatarFallback className="bg-primary/10"><Bot size={18} /></AvatarFallback></Avatar>
                                    <div className="bg-muted rounded-xl px-4 py-3 rounded-bl-none flex items-center gap-2">
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        <span className="text-sm text-muted-foreground">Pensando...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                     </ScrollArea>
                     <div className="p-4 border-t">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <Input 
                                placeholder="Escribe tu mensaje al agente..."
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isResponding}
                            />
                            <Button type="submit" size="icon" disabled={isResponding || !currentMessage.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        {/* Right Panel - Config & Metadata */}
        <div className="lg:col-span-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de la Prueba</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label htmlFor="agent-selector">Seleccionar Agente a Probar</Label>
                        <Select value={selectedAgent} onValueChange={(value: AgentId) => setSelectedAgent(value)} disabled={messages.length > 0}>
                            <SelectTrigger id="agent-selector">
                                <SelectValue placeholder="Selecciona un agente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Agente Global (Gratis)</SelectItem>
                                <SelectItem value="valeria_premium">Valeria Premium</SelectItem>
                                <SelectItem value="business" disabled>Agente de Negocio (Próximamente)</SelectItem>
                            </SelectContent>
                        </Select>
                        {messages.length > 0 && <p className="text-xs text-muted-foreground mt-2">Reinicia la sesión para cambiar de agente.</p>}
                    </div>
                    {selectedAgent === 'valeria_premium' && (
                        <div>
                             <Label>Documento de Contexto</Label>
                            {contextFile ? (
                                <div className="flex items-center justify-between p-2 border rounded-md bg-muted">
                                    <p className="text-sm truncate flex-1 flex items-center gap-2"><Paperclip className="h-4 w-4" />{contextFile.name}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setContextFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                    <FileUp className="mr-2 h-4 w-4"/>
                                    Adjuntar Documento (PDF)
                                </Button>
                            )}
                             <Input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleFileChange}
                                accept=".pdf"
                                disabled={messages.length > 0}
                            />
                             {messages.length > 0 && <p className="text-xs text-muted-foreground mt-2">Reinicia la sesión para cambiar el documento.</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BrainCircuit/> Metadatos de IA</CardTitle>
                    <CardDescription>Información de depuración de la última respuesta.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center py-8 text-muted-foreground">
                        (Próximamente)
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
