
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

import { SiGooglecalendar } from "react-icons/si/index.js";
import { SiGooglereviews } from "react-icons/si/index.js";
import { SiWhatsapp } from "react-icons/si/index.js";
import { SiStripe } from "react-icons/si/index.js";
import { SiGoogleanalytics } from "react-icons/si/index.js";
import { SiGoogleads } from "react-icons/si/index.js";
import { SiGooglephotos } from "react-icons/si/index.js";

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
                            disabled={isPending || !canEnableAgent}
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
                        isConnectPending={isConnecting}
                        disabled={!isAgentEnabled}
                    />
                    <ToolCard
                        icon={<SiGooglereviews className="text-[#F9BC05]" />}
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
