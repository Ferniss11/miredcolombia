'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Bot } from 'lucide-react';
import type { AgentConfig } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAgentConfigAction, saveAgentConfigAction } from '@/lib/user-actions-legacy';

type AgentType = 'global' | 'plan_colombia' | 'plan_espana';

const agentDetails: Record<AgentType, { name: string; description: string }> = {
    global: {
        name: 'Agente Global',
        description: 'Este es el agente por defecto que interactúa con usuarios públicos y usuarios gratuitos.'
    },
    plan_colombia: {
        name: 'Agente Plan Colombia',
        description: 'Este agente se activa para los usuarios con una suscripción activa al "Plan Colombia".'
    },
    plan_espana: {
        name: 'Agente Plan España',
        description: 'Este agente se activa para los usuarios con una suscripción activa al "Plan España".'
    }
};

const AgentConfigForm = ({ agentId, agentType }: { agentId: AgentType, agentType: {name: string, description: string} }) => {
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, startTransition] = useTransition();
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
        startTransition(async () => {
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
            <CardContent className="space-y-6">
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
                            <SelectItem value="googleai/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                            <SelectItem value="googleai/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                            <SelectItem value="googleai/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        </SelectContent>
                    </Select>
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
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Bot className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Gestión de Agentes de IA</h1>
            </div>

             <Tabs defaultValue="global" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="global">Agente Global</TabsTrigger>
                    <TabsTrigger value="plan_colombia">Plan Colombia</TabsTrigger>
                    <TabsTrigger value="plan_espana">Plan España</TabsTrigger>
                </TabsList>
                <TabsContent value="global">
                    <AgentConfigForm agentId="global" agentType={agentDetails.global}/>
                </TabsContent>
                <TabsContent value="plan_colombia">
                     <AgentConfigForm agentId="plan_colombia" agentType={agentDetails.plan_colombia}/>
                </TabsContent>
                <TabsContent value="plan_espana">
                     <AgentConfigForm agentId="plan_espana" agentType={agentDetails.plan_espana}/>
                </TabsContent>
            </Tabs>
        </div>
    );
}
