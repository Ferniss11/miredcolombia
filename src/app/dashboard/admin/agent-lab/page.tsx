'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, TestTube2, RotateCcw, Bot, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import ChatWidget from '@/components/chat/ChatWidget';
import type { ChatMessage, TokenUsage, AgentConfig } from '@/lib/chat-types';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ResponseMetadata {
    usage: TokenUsage;
    cost: number;
    agentConfig: AgentConfig;
}

export default function AgentLabPage() {
  const [selectedAgent, setSelectedAgent] = useState<'global' | 'valeria_premium'>('global');
  const [lastResponseMeta, setLastResponseMeta] = useState<ResponseMetadata | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialHistory, setInitialHistory] = useState<ChatMessage[]>([]);
  const [isLoading, startLoadingTransition] = useTransition();

  const { user } = useAuth();
  const { toast } = useToast();

  const handleStartSession = () => {
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
                    userName: 'Lab User',
                    userPhone: '000000000',
                    userEmail: 'lab@miredcolombia.com',
                    userId: user.uid,
                    isLabSession: true, // Flag to identify this as a special session
                }),
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error?.message || 'Failed to create lab session.');
            }
            const { session, history } = await response.json();
            setSessionId(session.id);
            setInitialHistory(history); // Pass initial history to the widget
            setLastResponseMeta(null);
            setIsSessionActive(true);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Error desconocido' });
        }
    });
  };

  const handleResetSession = () => {
    setIsSessionActive(false);
    setSessionId(null);
    setInitialHistory([]);
  };
  
  const handleMessageReceived = (lastResponse: any) => {
    if (lastResponse) {
        setLastResponseMeta({
            usage: lastResponse.usage,
            cost: lastResponse.cost,
            agentConfig: lastResponse.agentConfig,
        });
    }
  }

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
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    {isSessionActive && sessionId ? (
                        <ChatWidget
                            isLabMode={true}
                            labConfig={{ agentId: selectedAgent, sessionId: sessionId }}
                            onReset={handleResetSession}
                            onMessageReceived={handleMessageReceived}
                            initialHistory={initialHistory} // Pass initial history
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            {isLoading ? (
                                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4"/>
                            ) : (
                                <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                            )}
                            <h3 className="text-xl font-semibold">
                                {isLoading ? 'Creando sesión de prueba...' : 'Sesión de Prueba Terminada'}
                            </h3>
                            <p className="text-muted-foreground mt-2">
                                {isLoading ? 'Por favor, espera un momento.' : 'Para iniciar una nueva conversación de prueba, selecciona un agente y haz clic en "Iniciar Sesión de Prueba".'}
                            </p>
                        </div>
                    )}
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
                        <Select value={selectedAgent} onValueChange={(value: 'global' | 'valeria_premium') => setSelectedAgent(value)} disabled={isSessionActive}>
                            <SelectTrigger id="agent-selector">
                                <SelectValue placeholder="Selecciona un agente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Agente Global (Gratis)</SelectItem>
                                <SelectItem value="valeria_premium">Valeria Premium (con RAG)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full" onClick={handleStartSession} disabled={isSessionActive || isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                        Iniciar Sesión de Prueba
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BrainCircuit/> Metadatos de IA</CardTitle>
                    <CardDescription>Información de depuración de la última respuesta.</CardDescription>
                </CardHeader>
                <CardContent>
                     {lastResponseMeta ? (
                        <div className="space-y-4 text-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between"><span>Tokens de Entrada:</span> <span className="font-mono">{lastResponseMeta.usage.inputTokens}</span></div>
                                <div className="flex justify-between"><span>Tokens de Salida:</span> <span className="font-mono">{lastResponseMeta.usage.outputTokens}</span></div>
                                <div className="border-t my-2"></div>
                                <div className="flex justify-between font-bold"><span>Tokens Totales:</span> <span className="font-mono">{lastResponseMeta.usage.totalTokens}</span></div>
                            </div>
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between font-bold">
                                    <span>Coste:</span> 
                                    <span className="font-mono">{lastResponseMeta.cost.toFixed(6)}€</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Modelo:</span> 
                                    <span className="font-mono text-xs">{lastResponseMeta.agentConfig.model}</span>
                                </div>
                            </div>
                             <div className="border-t pt-4 space-y-2">
                                <Label>System Prompt Utilizado</Label>
                                <p className="text-xs text-muted-foreground p-2 border rounded-md bg-muted h-32 overflow-y-auto">
                                    {lastResponseMeta.agentConfig.systemPrompt}
                                </p>
                             </div>
                        </div>
                     ) : (
                         <div className="text-center py-8 text-muted-foreground text-sm">
                            (Esperando una respuesta para mostrar metadatos)
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
