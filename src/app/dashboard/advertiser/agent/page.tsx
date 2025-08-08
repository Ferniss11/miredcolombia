
'use client';

import { useAuth } from "@/context/AuthContext";
import { useTransition, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getGoogleAuthUrlAction } from "@/lib/gcal-actions";
import { useRouter } from "next/navigation";
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Bot, TestTube, Power, PowerOff, Sparkles, MessageSquareText, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BusinessAgentConfig, BusinessProfile } from '@/lib/types';


import { SiGooglecalendar, SiWhatsapp, SiStripe, SiGoogleanalytics, SiGoogleads, SiGooglephotos } from "react-icons/si";

// ToolCard Component
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


const agentConfigSchema = z.object({
  model: z.string(),
  systemPrompt: z.string().min(10, "El prompt del sistema es demasiado corto."),
});
type AgentConfigFormValues = z.infer<typeof agentConfigSchema>;


export default function AdvertiserAgentPage() {
    const { user, userProfile, loading, refreshUserProfile } = useAuth();
    const [isAgentTogglePending, startAgentToggleTransition] = useTransition();
    const [isConfigSavePending, startConfigSaveTransition] = useTransition();
    const [isGcalConnecting, startGcalConnectingTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<AgentConfigFormValues>({
        resolver: zodResolver(agentConfigSchema),
        defaultValues: {
            model: 'googleai/gemini-1.5-flash-latest',
            systemPrompt: '',
        }
    });

    useEffect(() => {
        if (userProfile?.businessProfile?.agentConfig) {
            form.reset(userProfile.businessProfile.agentConfig);
        }
    }, [userProfile, form]);
    
    // Generic function to update parts of the business profile via API
    const updateProfile = async (dataToUpdate: Partial<BusinessProfile>) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.' });
            return { success: false };
        }
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/users/${user.uid}/business-profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(dataToUpdate),
            });
            if (!response.ok) {
                const apiError = await response.json();
                throw new Error(apiError.error?.message || 'Error del servidor al actualizar.');
            }
            await refreshUserProfile();
            return { success: true };
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al Actualizar', description: error.message });
            return { success: false };
        }
    }


    const handleAgentToggle = async (isAgentEnabled: boolean) => {
        startAgentToggleTransition(async () => {
            const result = await updateProfile({ isAgentEnabled });
            if (result.success) {
                toast({ title: 'Éxito', 'description': `Agente de IA ${isAgentEnabled ? 'activado' : 'desactivado'}.` });
            }
        });
    };

    const handleSaveConfig = async (values: AgentConfigFormValues) => {
        startConfigSaveTransition(async () => {
            const result = await updateProfile({ agentConfig: values });
            if (result.success) {
                toast({ title: 'Éxito', description: 'La configuración de tu agente ha sido guardada.' });
            }
        });
    }

    const handleConnectGoogleCalendar = async () => {
        if (!user) return;
        startGcalConnectingTransition(async () => {
            const result = await getGoogleAuthUrlAction(user.uid);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else if (result.authUrl) {
                window.location.href = result.authUrl;
            }
        });
    };

    const handleDisconnectGoogleCalendar = async () => {
        toast({ title: "Función no implementada", description: "La desconexión se añadirá pronto." });
    };

    if (loading || !userProfile) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-1/2 bg-muted rounded-md animate-pulse"></div>
                <Card>
                    <CardHeader>
                        <div className="h-6 w-3/4 bg-muted rounded-md animate-pulse mb-2"></div>
                        <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                         <div className="h-20 w-full bg-muted rounded-md animate-pulse"></div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const verificationStatus = userProfile?.businessProfile?.verificationStatus;
    const isAgentEnabled = !!userProfile?.businessProfile?.isAgentEnabled;
    const isGcalConnected = !!userProfile?.businessProfile?.googleCalendarConnected;
    const isBusinessLinked = !!userProfile?.businessProfile?.placeId;
    const canEnableAgent = isBusinessLinked && verificationStatus === 'approved';

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary"/>
                Configuración del Agente IA
            </h1>
            
            <Card className={cn("transition-all duration-300", isAgentEnabled && "border-primary shadow-lg shadow-primary/20")}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="w-6 h-6"/>Agente de IA para tu Negocio</CardTitle>
                    <CardDescription>
                        Activa un asistente virtual en tu perfil público para responder preguntas de clientes y gestionar reservas automáticamente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <h3 className="font-medium">Asistente Virtual</h3>
                            <p className="text-sm text-muted-foreground">
                                {isAgentEnabled ? "Tu agente está activo y visible." : "Tu agente está desactivado."}
                            </p>
                        </div>
                         <Switch
                            checked={isAgentEnabled}
                            onCheckedChange={handleAgentToggle}
                            disabled={isAgentTogglePending || !canEnableAgent}
                        />
                    </div>
                    {!canEnableAgent && (
                         <p className="text-xs text-destructive mt-2">
                             {!isBusinessLinked 
                                ? "Debes vincular tu negocio en la pestaña de 'Perfil' para poder activar el agente."
                                : "Tu negocio debe estar verificado y aprobado por un administrador para activar el agente."
                             }
                        </p>
                    )}
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSaveConfig)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Personalidad del Agente</CardTitle>
                            <CardDescription>Define cómo se comporta tu asistente. Estos cambios se aplicarán la próxima vez que un usuario inicie una nueva conversación.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={form.control}
                                name="systemPrompt"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>System Prompt</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Eres un asistente amigable para [Nombre de tu negocio]..."
                                            rows={10}
                                            className="font-mono text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modelo de IA</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un modelo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash (Rápido)</SelectItem>
                                                <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro (Potente)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardContent>
                             <Button type="submit" disabled={isConfigSavePending}>
                                {isConfigSavePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Configuración del Agente
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </Form>


            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TestTube className="w-6 h-6"/>Conexiones de Herramientas</CardTitle>
                    <CardDescription>
                        Conecta herramientas externas para darle superpoderes a tu agente de IA. Debes tener el agente activado para conectar herramientas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     <ToolCard
                        icon={<SiGooglecalendar className="text-[#4285F4]" />}
                        title="Google Calendar"
                        description="Permite al agente ver tu disponibilidad y agendar citas."
                        isConnected={isGcalConnected}
                        onConnect={handleConnectGoogleCalendar}
                        onDisconnect={handleDisconnectGoogleCalendar}
                        isConnectPending={isGcalConnecting}
                        disabled={!isAgentEnabled}
                    />
                    <ToolCard
                        icon={<MessageSquareText className="text-[#F9BC05]" />}
                        title="Google Reviews"
                        description="Permite al agente leer y responder a las reseñas de los clientes."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                     <ToolCard
                        icon={<SiWhatsapp className="text-[#25D366]" />}
                        title="WhatsApp"
                        description="Envía notificaciones y recordatorios de citas a tus clientes."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                     <ToolCard
                        icon={<SiStripe className="text-[#635BFF]" />}
                        title="Stripe"
                        description="Acepta pagos para reservas o servicios directamente desde el chat."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                    <ToolCard
                        icon={<SiGoogleanalytics className="text-[#F9AB00]" />}
                        title="Google Analytics"
                        description="Obtén datos sobre quién visita tu perfil y usa el agente."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                     <ToolCard
                        icon={<SiGoogleads className="text-[#4285F4]" />}
                        title="Google Ads"
                        description="Crea y gestiona campañas de anuncios con la ayuda de la IA."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                     <ToolCard
                        icon={<SiGooglephotos className="text-[#EA4335]" />}
                        title="Google Photos"
                        description="Gestiona y muestra la galería de tu negocio de forma inteligente."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                </CardContent>
            </Card>

        </div>
    )
}
