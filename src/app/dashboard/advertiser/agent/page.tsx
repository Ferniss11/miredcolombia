
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

// --- SVG Icon Components ---

const GoogleCalendarIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 4V2H9V4H15V2H17V4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4H7Z" fill="#34A853"/>
        <path d="M3 10H21V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V10Z" fill="#4285F4"/>
        <path d="M15 2H17V7H15V2Z" fill="#1A73E8"/>
        <path d="M7 2H9V7H7V2Z" fill="#1A73E8"/>
        <path d="M21 20.0001C21 21.1047 20.1046 22.0001 19 22.0001H5C3.89543 22.0001 3 21.1047 3 20.0001V17.0001H21V20.0001Z" fill="#FBBC04"/>
        <path d="M21 10H3V14H21V10Z" fill="#EA4335"/>
        <rect x="7" y="12" width="4" height="4" rx="1" fill="white" fillOpacity="0.8"/>
    </svg>
);
const GoogleReviewsIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="#F9BC05"/>
        <path d="M12 15.4V6.1L10.71 9.91L6.96 10.38L9.77 12.92L9.08 16.68L12 15.4Z" fill="#4285F4"/>
    </svg>
);
const WhatsAppIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.05 4.91C17.03 2.89 14.53 1.83 12 1.83C5.97 1.83 1 6.8 1 12.83C1 15.01 1.66 17.03 2.83 18.79L1 23L5.42 21.83C7.15 22.95 9.22 23.67 11.5 23.67H12C18.03 23.67 23 18.7 23 12.67C23 10.15 21.94 7.64 19.05 4.91Z" fill="#25D366"/>
        <path d="M16.47 14.37C16.18 14.22 14.91 13.63 14.65 13.54C14.39 13.44 14.2 13.39 14.01 13.68C13.82 13.97 13.26 14.56 13.07 14.75C12.88 14.94 12.68 15 12.39 14.85C11.66 14.49 10.45 14.03 9.35 12.98C8.53 12.2 7.97 11.24 7.78 10.95C7.59 10.66 7.74 10.51 7.89 10.36C8.02 10.23 8.18 10.04 8.32 9.89C8.47 9.74 8.52 9.6 8.62 9.4C8.72 9.21 8.67 9.06 8.57 8.92C8.47 8.77 7.92 7.49 7.73 7C7.54 6.51 7.34 6.59 7.2 6.59H6.76C6.56 6.59 6.27 6.69 6.03 6.93C5.78 7.17 5.1 7.76 5.1 8.96C5.1 10.16 6.08 11.31 6.23 11.5C6.38 11.69 7.94 14.18 10.41 15.2C12.88 16.22 12.88 15.77 13.22 15.72C13.56 15.67 14.83 15.03 15.07 14.44C15.31 13.85 15.31 13.35 15.21 13.21C15.12 13.06 14.97 13.01 14.73 12.91L14.42 12.82" fill="white"/>
    </svg>
);
const StripeIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.688 3.344C13.688 2.656 13.125 2.063 12.406 2.063H2.063C1.375 2.063 0.813 2.656 0.813 3.344V8.5H13.688V3.344Z" fill="#635BFF"/>
        <path d="M22.313 15.5C23.031 15.5 23.625 14.906 23.625 14.219V8.5H10.594V14.125C10.594 14.844 11.188 15.438 11.875 15.438L13.125 15.5H22.313Z" fill="#635BFF"/>
        <path d="M11.906 21.938C12.625 21.938 13.219 21.344 13.219 20.656V15.5H0.344V20.656C0.344 21.344 0.938 21.938 1.625 21.938H11.906Z" fill="#635BFF"/>
    </svg>
);
const GoogleAnalyticsIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="12" width="6" height="8" rx="1" fill="#F9AB00"/>
        <rect x="10" y="8" width="6" height="12" rx="1" fill="#E94235"/>
        <rect x="17" y="4" width="6" height="16" rx="1" fill="#4285F4"/>
    </svg>
);
const GoogleAdsIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#4285F4"/>
        <path d="M12 6C8.69 6 6 8.69 6 12H8C8 9.79 9.79 8 12 8V6Z" fill="#34A853"/>
        <path d="M12 18C15.31 18 18 15.31 18 12H16C16 14.21 14.21 16 12 16V18Z" fill="#F9BC05"/>
    </svg>
);
const GooglePhotosIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C12 16.4772 16.4772 12 22 12V2C16.4772 2 12 6.47715 12 12V22Z" fill="#EA4335"/>
        <path d="M2 12C2 17.5228 6.47715 22 12 22V12C6.47715 12 2 7.52285 2 2V12Z" fill="#FBBC04"/>
        <path d="M12 2C17.5228 2 22 6.47715 22 12H12C12 6.47715 7.52285 2 2 2H12Z" fill="#4285F4"/>
        <path d="M22 12C22 7.52285 17.5228 3 12 3V12H22Z" fill="#34A853"/>
    </svg>
);


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
        <div className={cn("p-3 rounded-full bg-muted/80 mb-2 flex items-center justify-center h-14 w-14", isConnected && "bg-primary/10")}>
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
                        icon={<GoogleCalendarIcon />}
                        title="Google Calendar"
                        description="Permite al agente ver tu disponibilidad y agendar citas."
                        isConnected={isGcalConnected}
                        onConnect={handleConnectGoogleCalendar}
                        onDisconnect={handleDisconnectGoogleCalendar}
                        isConnectPending={isConnecting}
                        disabled={!isAgentEnabled}
                    />
                    <ToolCard
                        icon={<GoogleReviewsIcon />}
                        title="Google Reviews"
                        description="Permite al agente leer y responder a las reseñas de los clientes."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                     <ToolCard
                        icon={<WhatsAppIcon />}
                        title="WhatsApp"
                        description="Envía notificaciones y recordatorios de citas a tus clientes."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                     <ToolCard
                        icon={<StripeIcon />}
                        title="Stripe"
                        description="Acepta pagos para reservas o servicios directamente desde el chat."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                    <ToolCard
                        icon={<GoogleAnalyticsIcon />}
                        title="Google Analytics"
                        description="Obtén datos sobre quién visita tu perfil y usa el agente."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                     <ToolCard
                        icon={<GoogleAdsIcon />}
                        title="Google Ads"
                        description="Crea y gestiona campañas de anuncios con la ayuda de la IA."
                        isConnected={false}
                        disabled={!isAgentEnabled}
                    />
                     <ToolCard
                        icon={<GooglePhotosIcon />}
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
