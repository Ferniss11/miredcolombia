
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Bot, TestTube, Power, PowerOff, Sparkles, Search, Book } from 'lucide-react';
import { getAgentConfigAction, saveAgentConfigAction } from '@/lib/agent-actions';
import type { AgentConfig } from '@/lib/chat-types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MdPlace } from "react-icons/md";

// Reusable ToolCard Component
type ToolCardProps = {
    icon: React.ReactNode;
    title: string;
    description: string;
    isConnected: boolean;
    onConnect?: () => void;
    onDisconnect?: () => void;
    isConnectPending?: boolean;
    disabled?: boolean;
}

const ToolCard = ({ icon, title, description, isConnected, onConnect, onDisconnect, isConnectPending, disabled }: ToolCardProps) => (
    <div className={cn(
        "relative group flex flex-col items-center justify-center text-center p-4 border rounded-lg transition-all duration-300 space-y-2",
        isConnected ? "border-primary/80 bg-primary/5 shadow-md" : "bg-card hover:bg-muted/50",
        disabled && "opacity-60 cursor-not-allowed"
    )}>
        <div className={cn("p-3 rounded-full bg-muted/80 mb-2 flex items-center justify-center h-14 w-14 text-2xl", isConnected && "bg-primary/10 text-primary")}>
            {icon}
        </div>
        <h3 className="font-bold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground h-8">{description}</p>
        
        <div className="pt-2 w-full">
            {isConnected ? (
                <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" onClick={onDisconnect} disabled={disabled}>
                    <PowerOff className="mr-2 h-3.5 w-3.5"/> Desconectar
                </Button>
            ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={onConnect} disabled={isConnectPending || disabled}>
                     {isConnectPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin"/> : <Power className="mr-2 h-3.5 w-3.5"/>}
                    Conectar
                </Button>
            )}
        </div>
         {isConnected && (
            <div className="absolute top-2 right-2 text-green-500">
                <Power className="h-4 w-4" />
            </div>
        )}
    </div>
);


export default function AgentManagementPage() {
    const [config, setConfig] = useState<AgentConfig>({ model: 'googleai/gemini-1.5-flash-latest', systemPrompt: '' });
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [isSaving, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoadingConfig(true);
            const result = await getAgentConfigAction();
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else if (result.config) {
                setConfig(result.config);
            }
            setIsLoadingConfig(false);
        };

        fetchConfig();
    }, [toast]);

    const handleSave = () => {
        startTransition(async () => {
            const result = await saveAgentConfigAction(config);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al Guardar', description: result.error });
            } else {
                toast({ title: 'Éxito', description: '¡Configuración del agente guardada!' });
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Bot className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Gestión de Agente de Chat Global</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuración del Agente</CardTitle>
                    <CardDescription>Define la personalidad y el motor de tu asistente de IA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoadingConfig ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-1/2" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="system-prompt">System Prompt</Label>
                                <Textarea
                                    id="system-prompt"
                                    placeholder="Eres un asistente amigable..."
                                    value={config.systemPrompt}
                                    onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                                    rows={15}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model">Modelo de IA</Label>
                                <Select
                                    value={config.model}
                                    onValueChange={(value) => setConfig({ ...config, model: value })}
                                >
                                    <SelectTrigger id="model" className="w-full md:w-1/2">
                                        <SelectValue placeholder="Selecciona un modelo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash (Rápido)</SelectItem>
                                        <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro (Potente)</SelectItem>
                                        <SelectItem value="googleai/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                                        <SelectItem value="googleai/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                                        <SelectItem value="googleai/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={isSaving || isLoadingConfig}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Configuración
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TestTube className="w-6 h-6"/>Conexiones de Herramientas</CardTitle>
                    <CardDescription>
                        Conecta herramientas para darle superpoderes al agente de IA global.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     <ToolCard
                        icon={<Book className="text-[#4285F4]" />}
                        title="Base de Conocimiento"
                        description="Permite al agente buscar en tus documentos de inmigración."
                        isConnected={true}
                        disabled={true}
                    />
                    <ToolCard
                        icon={<Search className="text-[#F9BC05]" />}
                        title="Búsqueda Web"
                        description="Permite al agente buscar información actualizada en la web."
                        isConnected={false}
                        disabled={true}
                    />
                     <ToolCard
                        icon={<MdPlace className="text-[#34A853]" />}
                        title="Google Places"
                        description="Permite al agente buscar negocios en el directorio."
                        isConnected={false}
                        disabled={true}
                    />
                </CardContent>
            </Card>

        </div>
    );
}

    