
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Bot, Book, Calendar, Mail, Upload, Power, Database, AlertTriangle } from 'lucide-react';
import type { AgentConfig } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAgentConfigAction, saveAgentConfigAction } from '@/lib/user-actions-legacy';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';


type AgentType = 'global' | 'valeria_premium';

const agentDetails: Record<AgentType, { name: string; description: string }> = {
    global: {
        name: 'Agente Global (Gratis)',
        description: 'Este es el agente por defecto que interactúa con usuarios públicos y del plan gratuito.'
    },
    valeria_premium: {
        name: 'Agente Valeria Premium',
        description: 'Este agente se activa para los usuarios con una suscripción "Premium" activa.'
    }
};

const ToolCard = ({ icon: Icon, title, description, onConnect, isConnecting, isConnected }: { icon: React.ElementType, title: string, description: string, onConnect: () => void, isConnecting?: boolean, isConnected?: boolean }) => (
    <Card className="flex flex-col text-center items-center justify-start p-4 hover:bg-muted/50 transition-colors">
        <div className="p-3 bg-primary/10 rounded-lg mb-2">
            <Icon className="w-6 h-6 text-primary" />
        </div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1 flex-grow">{description}</p>
        <Button variant="outline" size="sm" className="mt-4 w-full" onClick={onConnect} disabled={isConnecting || isConnected}>
            {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
            {isConnected ? 'Conectado' : (isConnecting ? 'Conectando...' : 'Conectar')}
        </Button>
    </Card>
);

const AgentConfigForm = ({ agentId, agentType, onToolConnectClick }: { agentId: AgentType, agentType: {name: string, description: string}, onToolConnectClick: (toolName: 'kb' | 'gcal' | 'email' | 'docs') => void }) => {
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, startSavingTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            const result = await getAgentConfigAction(agentId);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else if (result.config) {
                setConfig(result.config);
            }
            setIsLoading(false);
        };
        fetchConfig();
    }, [agentId, toast]);

    const handleConfigChange = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
        setConfig(prev => prev ? { ...prev, [key]: value } : null);
    };

    const handleSave = () => {
        if (!config) return;
        startSavingTransition(async () => {
            const result = await saveAgentConfigAction(agentId, config);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al Guardar', description: result.error });
            } else {
                toast({ title: 'Éxito', description: `¡Configuración del agente ${agentType.name} guardada!` });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-1/2" />
            </div>
        )
    }
    
    if (!config) return <p>No se pudo cargar la configuración.</p>

    return (
        <Card className="border-none shadow-none">
            <CardHeader>
                <CardTitle>{agentType.name}</CardTitle>
                <CardDescription>{agentType.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Main Configuration */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor={`system-prompt-${agentId}`}>System Prompt</Label>
                            <Textarea
                                id={`system-prompt-${agentId}`}
                                placeholder="Eres un asistente amigable..."
                                value={config.systemPrompt}
                                onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                                rows={15}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`model-${agentId}`}>Modelo de IA</Label>
                            <Select
                                value={config.model}
                                onValueChange={(value) => handleConfigChange('model', value)}
                            >
                                <SelectTrigger id={`model-${agentId}`} className="w-full md:w-1/2">
                                    <SelectValue placeholder="Selecciona un modelo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash (Rápido)</SelectItem>
                                    <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro (Potente)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Right Column: Tools */}
                    <div className="lg:col-span-1 space-y-4">
                        <Label>Herramientas del Agente</Label>
                         <div className="grid grid-cols-2 gap-4">
                           <ToolCard 
                                icon={Database}
                                title="Base de Conocimiento"
                                description="Conecta al agente a tus guías y artículos."
                                onConnect={() => onToolConnectClick('kb')}
                           />
                           <ToolCard 
                                icon={Calendar}
                                title="Google Calendar"
                                description="Permite al agente agendar citas."
                                onConnect={() => onToolConnectClick('gcal')}
                           />
                           <ToolCard 
                                icon={Mail}
                                title="Conexión Email"
                                description="Autoriza al agente a enviar correos."
                                onConnect={() => onToolConnectClick('email')}
                           />
                            <ToolCard 
                                icon={Upload}
                                title="Análisis de Docs"
                                description="Sube PDFs para que el agente los analice."
                                onConnect={() => onToolConnectClick('docs')}
                           />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Configuración
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function AgentManagementPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isDevModalOpen, setIsDevModalOpen] = useState(false);
    const [isIndexing, startIndexingTransition] = useTransition();

    const handleToolConnection = (toolName: 'kb' | 'gcal' | 'email' | 'docs') => {
        if (toolName === 'kb') {
            startIndexing();
        } else {
            setIsDevModalOpen(true);
        }
    };
    
    const startIndexing = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes estar autenticado.' });
            return;
        }

        startIndexingTransition(async () => {
            try {
                toast({ title: 'Iniciando indexación...', description: 'Este proceso puede tardar unos minutos. Te notificaremos cuando termine.' });
                
                const token = await user.getIdToken();
                const response = await fetch('/api/indexing/start', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error?.message || 'Error desconocido del servidor.');
                }
                
                const result = await response.json();
                toast({
                    title: '¡Indexación completada!',
                    description: `Se han procesado ${result.indexedGuides} guías y ${result.indexedPosts} artículos.`,
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error inesperado.';
                toast({ variant: 'destructive', title: 'Error de Indexación', description: errorMessage });
            }
        });
    };


    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Bot className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">Gestión de Agentes de IA</h1>
                </div>

                <Tabs defaultValue="global" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="global">Agente Global (Gratis)</TabsTrigger>
                        <TabsTrigger value="valeria_premium">Valeria Premium</TabsTrigger>
                    </TabsList>
                    <TabsContent value="global">
                        <AgentConfigForm agentId="global" agentType={agentDetails.global} onToolConnectClick={handleToolConnection} />
                    </TabsContent>
                    <TabsContent value="valeria_premium">
                        <AgentConfigForm agentId="valeria_premium" agentType={agentDetails.valeria_premium} onToolConnectClick={handleToolConnection} />
                    </TabsContent>
                </Tabs>
            </div>

            <AlertDialog open={isDevModalOpen} onOpenChange={setIsDevModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                           <AlertTriangle className="text-yellow-500" />
                            Función en Desarrollo
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            La conexión de esta herramienta está planificada en nuestra hoja de ruta. ¡Estamos trabajando para traerla pronto!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cerrar</AlertDialogCancel>
                        <AlertDialogAction asChild>
                           <Link href="/reestructuracion">Ver Hoja de Ruta</Link>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

