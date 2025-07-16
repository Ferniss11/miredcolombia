
'use client';

import { useAuth } from "@/context/AuthContext";
import { useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateBusinessAgentStatusAction } from "@/lib/user-actions";
import { getGoogleAuthUrlAction } from "@/lib/gcal-actions";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Bot, TestTube, Power, PowerOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";


export default function AdvertiserAgentPage() {
    const { user, userProfile, loading, refreshUserProfile } = useAuth();
    const [isPending, startTransition] = useTransition();
    const [isConnecting, startConnectingTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleAgentToggle = async (isAgentEnabled: boolean) => {
        if (!user) return;
        
        startTransition(async () => {
            const result = await updateBusinessAgentStatusAction(user.uid, isAgentEnabled);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Éxito', 'description': `Agente de IA ${isAgentEnabled ? 'activado' : 'desactivado'}.` });
                await refreshUserProfile();
            }
        });
    };

    const handleConnectGoogleCalendar = async () => {
        if (!user) return;
        startConnectingTransition(async () => {
            const result = await getGoogleAuthUrlAction(user.uid);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else if (result.authUrl) {
                // Redirect to Google's consent screen
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
                            disabled={isPending || verificationStatus !== 'approved'}
                        />
                    </div>
                    {verificationStatus !== 'approved' && (
                         <p className="text-xs text-destructive mt-2">Debes tener tu negocio verificado para poder activar el agente.</p>
                    )}
                     {!isBusinessLinked && (
                         <p className="text-xs text-destructive mt-2">Debes vincular tu negocio en la pestaña de 'Perfil' para poder activar el agente.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TestTube className="w-6 h-6"/>Conexiones de Herramientas</CardTitle>
                    <CardDescription>
                        Conecta herramientas externas como Google Calendar para darle superpoderes a tu agente de IA.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                            <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" width={32} height={32}/>
                            <div>
                                <h3 className="font-medium">Google Calendar</h3>
                                <p className={cn("text-sm", isGcalConnected ? "text-green-600" : "text-muted-foreground")}>
                                    {isGcalConnected ? "Conectado" : "No conectado"}
                                </p>
                            </div>
                        </div>
                        {isGcalConnected ? (
                            <Button variant="destructive" onClick={handleDisconnectGoogleCalendar} disabled={isConnecting}>
                                <PowerOff className="mr-2 h-4 w-4" /> Desconectar
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={handleConnectGoogleCalendar} disabled={isConnecting || !isBusinessLinked || !isAgentEnabled}>
                                {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Power className="mr-2 h-4 w-4"/>}
                                Conectar
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Permitir que el agente lea tu calendario para encontrar huecos libres y cree eventos para agendar citas. Debes tener el agente activado para conectar herramientas.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
