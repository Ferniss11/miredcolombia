
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Bot, MessageSquare, Tag, Eye } from 'lucide-react';
import { getAgentConfigAction, saveAgentConfigAction, getChatSessionsAction } from '@/lib/agent-actions';
import type { AgentConfig, ChatSessionWithTokens } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AgentManagementPage() {
    const [config, setConfig] = useState<AgentConfig>({ model: 'googleai/gemini-1.5-flash-latest', systemPrompt: '' });
    const [sessions, setSessions] = useState<ChatSessionWithTokens[]>([]);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [isSaving, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

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
        
        const fetchSessions = async () => {
            setIsLoadingSessions(true);
            const result = await getChatSessionsAction();
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else if (result.sessions) {
                setSessions(result.sessions);
            }
            setIsLoadingSessions(false);
        };

        fetchConfig();
        fetchSessions();
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
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    
    const handleRowClick = (sessionId: string) => {
        router.push(`/dashboard/admin/agent/${sessionId}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Bot className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Gestión de Agente de Chat</h1>
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
                    <CardTitle>Conversaciones de Usuarios</CardTitle>
                    <CardDescription>Supervisa las interacciones de los usuarios con el agente de IA.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Fecha Creación</TableHead>
                                <TableHead className="text-right">Mensajes</TableHead>
                                <TableHead className="text-right">Coste Total Tokens</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingSessions ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : sessions.length > 0 ? (
                                sessions.map(session => (
                                    <TableRow key={session.id} onClick={() => handleRowClick(session.id)} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell>
                                            <div className="font-medium">{session.userName}</div>
                                            <div className="text-sm text-muted-foreground">{session.userPhone}</div>
                                        </TableCell>
                                        <TableCell>{formatDate(session.createdAt)}</TableCell>
                                        <TableCell className="text-right">{session.messageCount}</TableCell>
                                        <TableCell className="text-right font-bold font-mono">{session.totalTokens}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">
                                                <Eye className="mr-2 h-3 w-3" />
                                                Ver
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        No hay conversaciones todavía.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
