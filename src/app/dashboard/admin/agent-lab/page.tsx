
'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, TestTube2, RotateCcw, Bot, Trash2, MessageSquare, PlusCircle, Database, FileText, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import ChatWidget from '@/components/chat/ChatWidget';
import type { ChatMessage, TokenUsage, AgentConfig, ChatSession } from '@/lib/chat-types';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import DebugInfoCard from '@/components/debug/DebugInfoCard';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// --- Types ---
interface ResponseMetadata {
    usage: TokenUsage;
    cost: number;
    agentConfig: AgentConfig;
}

type KnowledgeDocument = {
  id: string;
  doc_title: string;
  source: 'admin_kb' | 'user_session';
  doc_type: string;
  chunk_count: number;
  sessionId?: string;
};


// --- Sub-components ---
const SessionList = ({ sessions, onSelect, onDelete, activeSessionId, isLoading }: { sessions: ChatSession[], onSelect: (session: ChatSession) => void, onDelete: (sessionId: string) => void, activeSessionId: string | null, isLoading: boolean }) => (
     <div className="relative flex-1 min-h-0">
        <ScrollArea className="absolute inset-0">
            <div className="space-y-2 p-4">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />)
                ) : sessions.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-10">No hay sesiones de prueba.</div>
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
     </div>
);

const MetadataModal = ({ session, isOpen, onOpenChange }: { session: ChatSession | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const formatCurrency = (value: number = 0) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 5 }).format(value);
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><BrainCircuit/> Metadatos de la Sesión</DialogTitle>
                    <DialogDescription>Información técnica sobre la conversación actual para depuración.</DialogDescription>
                </DialogHeader>
                {session ? (
                    <div className="space-y-4 text-sm py-4">
                        <div className="flex justify-between font-bold"><span>Coste Total:</span> <span className="font-mono">{formatCurrency(session.totalCost)}</span></div>
                        <Separator/>
                        <div className="flex justify-between"><span>Tokens Totales:</span> <span className="font-mono">{(session.totalTokens || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between text-muted-foreground"><span>└─ Input:</span> <span className="font-mono">{(session.totalInputTokens || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between text-muted-foreground"><span>└─ Output:</span> <span className="font-mono">{(session.totalOutputTokens || 0).toLocaleString()}</span></div>
                        <Separator/>
                        <div>
                            <Label>Modelo Utilizado</Label>
                            <p className="text-xs whitespace-pre-wrap font-mono p-3 border rounded-md bg-muted">
                                {session.agentConfig?.model || '(No disponible aún)'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">No hay una sesión activa para mostrar metadatos.</div>
                )}
            </DialogContent>
        </Dialog>
    )
}

const KnowledgeContextModal = ({ user, toast, onUpdate, sessionId, isOpen, onOpenChange }: { user: any, toast: any, onUpdate: () => void, sessionId: string | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, startDeleteTransition] = useTransition();

    const fetchDocuments = useCallback(async () => {
        if (!user || !sessionId) {
            setDocuments([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/knowledge-base?sessionId=${sessionId}`, { headers: { Authorization: `Bearer ${idToken}` } });
            if (!response.ok) throw new Error('Failed to fetch documents for session');
            const data = await response.json();
            setDocuments(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la base de conocimiento de la sesión.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast, sessionId]);

    useEffect(() => {
        if (isOpen) {
            fetchDocuments();
        }
    }, [isOpen, fetchDocuments]);

    const handleDelete = (docId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este documento y todos sus fragmentos?")) return;
        startDeleteTransition(async () => {
             try {
                const idToken = await user.getIdToken();
                const response = await fetch(`/api/knowledge-base/${docId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${idToken}` } });
                if (!response.ok) throw new Error('Error al eliminar');
                toast({ title: 'Documento Eliminado' });
                fetchDocuments();
                onUpdate();
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el documento.' });
            }
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                 <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Database/> Documentos en Contexto</DialogTitle>
                    <DialogDescription>Documentos globales (admin) y de sesión (usuario) disponibles para la IA en esta conversación.</DialogDescription>
                </DialogHeader>
                <div className="border rounded-md max-h-[60vh] overflow-y-auto mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Documento</TableHead>
                                <TableHead>Origen</TableHead>
                                <TableHead>Chunks</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4}><Skeleton className="h-5 w-full"/></TableCell></TableRow>
                            ) : documents.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center h-20 text-muted-foreground">No hay documentos en el contexto.</TableCell></TableRow>
                            ) : (
                                documents.map(doc => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/>{doc.doc_title}</TableCell>
                                        <TableCell>
                                            <Badge variant={doc.source === 'admin_kb' ? 'secondary' : 'outline'}>
                                                {doc.source === 'admin_kb' ? 'Global' : 'Sesión'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{doc.chunk_count}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(doc.id)} disabled={isDeleting}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Page Component ---
export default function AgentLabPage() {
  const [selectedAgent, setSelectedAgent] = useState<'global' | 'valeria_premium'>('global');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [initialHistory, setInitialHistory] = useState<ChatMessage[]>([]);
  const [isLoading, startLoadingTransition] = useTransition();
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  
  const [isMetadataModalOpen, setMetadataModalOpen] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [knowledgeBaseKey, setKnowledgeBaseKey] = useState(0);

  const [debugInfo, setDebugInfo] = useState<any | null>(null);

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
    setActiveSession(null);
    setInitialHistory([]);
    setDebugInfo(null);
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
            setDebugInfo(null);
            const agentId = fullSession.userName?.includes('valeria_premium') ? 'valeria_premium' : 'global';
            setSelectedAgent(agentId);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el historial de la sesión.' });
        }
    });
  }
  
  const handleCreateAndSelectSession = () => {
       if (!user) return;
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
            setDebugInfo(null);
            await fetchLabSessions();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Error desconocido' });
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
                setDebugInfo(null);
            }
            setDeletingSessionId(null);
            await fetchLabSessions();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la sesión.' });
        }
    });
  }

  const handleMessageReceived = (lastResponse: any) => {
    if (lastResponse) {
        if (activeSession) {
            setActiveSession(prev => prev ? ({
                ...prev,
                totalCost: (prev.totalCost || 0) + (lastResponse.cost || 0),
                totalInputTokens: (prev.totalInputTokens || 0) + (lastResponse.usage?.inputTokens || 0),
                totalOutputTokens: (prev.totalOutputTokens || 0) + (lastResponse.usage?.outputTokens || 0),
                totalTokens: (prev.totalTokens || 0) + (lastResponse.usage?.totalTokens || 0),
                agentConfig: lastResponse.agentConfig,
            }) : null);
        }
        setDebugInfo(lastResponse.debugInfo || null);
        if (lastResponse.debugInfo?.generatedChunks) {
            setKnowledgeBaseKey(prev => prev + 1);
        }
    }
  }

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-0">
        <div className="flex items-center gap-4 mb-4 flex-shrink-0">
            <TestTube2 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Laboratorio de Agentes IA</h1>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        
            <div className="lg:col-span-4 xl:col-span-3 h-full flex flex-col gap-4">
                <Card>
                    <CardContent className="p-2 flex flex-row items-center gap-2">
                        <Select value={selectedAgent} onValueChange={(value: 'global' | 'valeria_premium') => setSelectedAgent(value)} disabled={!!activeSession}>
                            <SelectTrigger id="agent-selector" className="flex-1">
                                <SelectValue placeholder="Selecciona un agente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Agente Global (Gratis)</SelectItem>
                                <SelectItem value="valeria_premium">Valeria Premium (con RAG)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={activeSession ? handleStartNewSession : handleCreateAndSelectSession} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (activeSession ? <RotateCcw className="h-4 w-4"/> : <PlusCircle className="h-4 w-4" />)}
                        </Button>
                    </CardContent>
                </Card>
                <SessionList 
                    sessions={sessions}
                    onSelect={handleSelectSession}
                    onDelete={(id) => setDeletingSessionId(id)}
                    activeSessionId={activeSession?.id || null}
                    isLoading={isLoadingSessions}
                />
            </div>

            <div className="lg:col-span-8 xl:col-span-9 h-full min-h-0 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader className="flex-row items-center justify-between p-3 h-14">
                        <CardTitle className="text-base">Simulador de Chat</CardTitle>
                         <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setIsKnowledgeModalOpen(true)} disabled={!activeSession}>
                                <Database className="h-5 w-5"/>
                                <span className="sr-only">Ver Base de Conocimiento en Contexto</span>
                            </Button>
                             <Button variant="ghost" size="icon" onClick={() => setMetadataModalOpen(true)} disabled={!activeSession}>
                                <BrainCircuit className="h-5 w-5"/>
                                <span className="sr-only">Ver Metadatos</span>
                            </Button>
                        </div>
                    </CardHeader>
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
                                <p className="text-muted-foreground mt-2">{isLoading ? 'Por favor, espera un momento.' : 'Selecciona una sesión de la izquierda o inicia una nueva prueba.'}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                 <div className="flex-shrink-0 space-y-4">
                    {debugInfo && (
                        <DebugInfoCard title="Información de Depuración (Último Mensaje)" description="Resultados devueltos por las herramientas de Genkit en el último turno." data={debugInfo} />
                    )}
                </div>
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

      <MetadataModal 
        session={activeSession} 
        isOpen={isMetadataModalOpen}
        onOpenChange={setMetadataModalOpen}
      />
      
      <KnowledgeContextModal
        user={user}
        toast={toast}
        onUpdate={() => setKnowledgeBaseKey(k => k + 1)}
        sessionId={activeSession?.id || null}
        isOpen={isKnowledgeModalOpen}
        onOpenChange={setIsKnowledgeModalOpen}
      />
    </>
  );
}
