'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, TestTube2, RotateCcw, Bot, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';
import ChatWidget from '@/components/chat/ChatWidget'; // Import the main ChatWidget
import type { ChatMessage, TokenUsage } from '@/lib/chat-types';
import { Button } from '@/components/ui/button';

interface ResponseMetadata {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

export default function AgentLabPage() {
  const [selectedAgent, setSelectedAgent] = useState<'global' | 'valeria_premium'>('global');
  const [lastResponseMeta, setLastResponseMeta] = useState<ResponseMetadata | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Create a unique session ID for this lab instance that changes on reset
  const [sessionId, setSessionId] = useState(uuidv4());
  
  const handleStartSession = () => {
    // Reset metadata and create a new session ID, then activate the chat view
    setLastResponseMeta(null);
    setSessionId(uuidv4());
    setIsSessionActive(true);
  };

  const handleResetSession = () => {
    // This will bring the user back to the "Start Session" screen
    setIsSessionActive(false);
  };
  
  const handleMessageReceived = (message: ChatMessage) => {
      if (message.role === 'model' && message.usage) {
          setLastResponseMeta(message.usage);
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
                    {isSessionActive ? (
                        <ChatWidget
                            isLabMode={true}
                            labConfig={{ agentId: selectedAgent, sessionId: sessionId }}
                            onReset={handleResetSession}
                            onMessageReceived={handleMessageReceived}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">Sesión de Prueba Terminada</h3>
                            <p className="text-muted-foreground mt-2">
                                Para iniciar una nueva conversación de prueba, selecciona un agente y haz clic en "Iniciar Sesión de Prueba".
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
                        <Select value={selectedAgent} onValueChange={(value: 'global' | 'valeria_premium') => setSelectedAgent(value)}>
                            <SelectTrigger id="agent-selector">
                                <SelectValue placeholder="Selecciona un agente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Agente Global (Gratis)</SelectItem>
                                <SelectItem value="valeria_premium">Valeria Premium (con RAG)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full" onClick={handleStartSession}>
                        <LogIn className="mr-2 h-4 w-4" />
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
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Tokens de Entrada:</span> <span className="font-mono">{lastResponseMeta.inputTokens}</span></div>
                            <div className="flex justify-between"><span>Tokens de Salida:</span> <span className="font-mono">{lastResponseMeta.outputTokens}</span></div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between font-bold"><span>Tokens Totales:</span> <span className="font-mono">{lastResponseMeta.totalTokens}</span></div>
                        </div>
                     ) : (
                         <div className="text-center py-8 text-muted-foreground">
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
