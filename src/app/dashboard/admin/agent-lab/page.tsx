
'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, TestTube2, RotateCcw, Bot, LogIn, Trash2, MessageSquare, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import ChatWidget from '@/components/chat/ChatWidget';
import type { ChatMessage, TokenUsage, AgentConfig, ChatSession } from '@/lib/chat-types';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

interface ResponseMetadata {
    usage: TokenUsage;
    cost: number;
    agentConfig: AgentConfig;
}

// --- Session List Component ---
const SessionList = ({ sessions, onSelect, onDelete, activeSessionId, isLoading }: { sessions: ChatSession[], onSelect: (session: ChatSession) => void, onDelete: (sessionId: string) => void, activeSessionId: string | null, isLoading: boolean }) => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Sesiones de Prueba</CardTitle>
                <CardDescription>Selecciona una sesión para continuarla o eliminarla.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-2 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-2 p-2">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />)
                        ) : sessions.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-10">No hay sesiones guardadas.</div>
                        ) : (
                            sessions.map(session => (
                                <div
                                    key={session.id}
                                    className={cn(
                                        "p-2 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors group",
                                        activeSessionId === session.id && "bg-primary/10 border-primary"
                                    )}
                                    onClick={() => onSelect(session)}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-sm line-clamp-1">{session.userName || 'Sesión de Laboratorio'}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                            onClick={(e) => { e.stopPropagation(); onDelete(session.id!); }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{new Date(session.createdAt).toLocaleString('es-ES')}</p>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};


export default function AgentLabPage() {
  const [selectedAgent, setSelectedAgent] = useState<'global' | 'valeria_premium'>('global');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [initialHistory, setInitialHistory] = useState<ChatMessage[]>([]);
  const [isLoading, startLoadingTransition] = useTransition();
  
  // New state for managing the list of sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLabSessions = useCallback(async () => {
    if (!user) return;
    setIsLoadingSessions(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/chat/sessions?userId=${user.uid}&isLabSession=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const sessionsData = await response.json();
      setSessions(sessionsData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las sesiones.' });
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchLabSessions();
  }, [fetchLabSessions]);


  const handleStartNewSession = () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes estar autenticado.' });
      return;
    }
    startLoadingTransition(async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            userName: `Lab: ${selectedAgent}`,
            userId: user.uid,
            isLabSession: true,
          }),
        });
        if (!response.ok) throw new Error((await response.json()).error?.message);
        
        const { session, history } = await response.json();
        setActiveSession(session);
        setInitialHistory(history);
        fetchLabSessions(); // Refresh list to include the new session
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Error desconocido' });
      }
    });
  };
  
  const handleSelectSession = (session: ChatSession) => {
    startLoadingTransition(async () => {
        if (!user || !session.id) return;
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/chat/sessions/${session.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error((await response.json()).error?.message);
            const { session: fullSession, messages } = await response.json();
            setActiveSession(fullSession);
            setInitialHistory(messages);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el historial de la sesión.' });
        }
    });
  }

  const handleDeleteSession = async () => {
    if (!deletingSessionId || !user) return;
    startLoadingTransition(async () => {
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/chat/sessions/${deletingSessionId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error((await response.json()).error?.message);
            toast({ title: 'Sesión eliminada' });
            if (activeSession?.id === deletingSessionId) {
                setActiveSession(null);
                setInitialHistory([]);
            }
            setDeletingSessionId(null);
            fetchLabSessions(); // Refresh list
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la sesión.' });
        }
    });
  }

  const handleMessageReceived = (lastResponse: any) => {
    if (lastResponse && activeSession) {
        setActiveSession(prev => prev ? ({
            ...prev,
            totalCost: (prev.totalCost || 0) + (lastResponse.cost || 0),
            totalInputTokens: (prev.totalInputTokens || 0) + (lastResponse.usage?.inputTokens || 0),
            totalOutputTokens: (prev.totalOutputTokens || 0) + (lastResponse.usage?.outputTokens || 0),
            totalTokens: (prev.totalTokens || 0) + (lastResponse.usage?.totalTokens || 0),
            agentConfig: lastResponse.agentConfig,
        }) : null);
    }
  }

  const formatCurrency = (value: number = 0) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 5 }).format(value);
  }

  return (
    <>
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex items-center gap-4">
        <TestTube2 className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Laboratorio de Agentes IA</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        
        <div className="lg:col-span-3 h-full min-h-0">
             <SessionList 
                sessions={sessions}
                onSelect={handleSelectSession}
                onDelete={(id) => setDeletingSessionId(id)}
                activeSessionId={activeSession?.id || null}
                isLoading={isLoadingSessions}
             />
        </div>

        <div className="lg:col-span-9 h-full flex flex-col gap-6 min-h-0">
             {/* -- New Header Area -- */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div>
                             <Label htmlFor="agent-selector">Seleccionar Agente a Probar</Label>
                            <Select value={selectedAgent} onValueChange={(value: 'global' | 'valeria_premium') => setSelectedAgent(value)} disabled={!!activeSession}>
                                <SelectTrigger id="agent-selector">
                                    <SelectValue placeholder="Selecciona un agente" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">Agente Global (Gratis)</SelectItem>
                                    <SelectItem value="valeria_premium">Valeria Premium (con RAG)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button className="w-full mt-2" onClick={handleStartNewSession} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                                Iniciar Nueva Sesión
                            </Button>
                        </div>
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    <span className="flex items-center gap-2"><BrainCircuit/> Metadatos de la Sesión</span>
                                    <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                                 {activeSession ? (
                                    <div className="space-y-4 text-sm p-4 border rounded-md">
                                        <div className="flex justify-between font-bold"><span>Coste Total:</span> <span className="font-mono">{formatCurrency(activeSession.totalCost)}</span></div>
                                        <Separator/>
                                        <div className="flex justify-between"><span>Tokens Totales:</span> <span className="font-mono">{(activeSession.totalTokens || 0).toLocaleString()}</span></div>
                                        <div className="flex justify-between text-muted-foreground"><span>└─ Input:</span> <span className="font-mono">{(activeSession.totalInputTokens || 0).toLocaleString()}</span></div>
                                        <div className="flex justify-between text-muted-foreground"><span>└─ Output:</span> <span className="font-mono">{(activeSession.totalOutputTokens || 0).toLocaleString()}</span></div>
                                        <Separator/>
                                        <div>
                                            <Label>System Prompt Utilizado</Label>
                                            <p className="text-xs text-muted-foreground p-2 mt-1 border rounded-md bg-muted h-24 overflow-y-auto">
                                                {activeSession.agentConfig?.systemPrompt || '(No disponible aún)'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground text-sm border rounded-md">(Selecciona o crea una sesión)</div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </CardContent>
            </Card>

            {/* -- Chat Area -- */}
            <Card className="flex-1 flex flex-col min-h-0">
                <CardContent className="flex-1 overflow-hidden p-0">
                    {activeSession?.id ? (
                        <ChatWidget
                            isLabMode={true}
                            labConfig={{ agentId: selectedAgent, sessionId: activeSession.id }}
                            onMessageReceived={handleMessageReceived}
                            initialHistory={initialHistory}
                            onReset={handleStartNewSession}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            {isLoading ? <Loader2 className="h-12 w-12 animate-spin text-primary mb-4"/> : <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />}
                            <h3 className="text-xl font-semibold">{isLoading ? 'Cargando sesión...' : 'Ninguna Sesión Activa'}</h3>
                            <p className="text-muted-foreground mt-2">{isLoading ? 'Por favor, espera un momento.' : 'Selecciona una sesión de la izquierda o crea una nueva.'}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
    
     <AlertDialog open={!!deletingSessionId} onOpenChange={(open) => !open && setDeletingSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará permanentemente la sesión de chat y todo su historial.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

