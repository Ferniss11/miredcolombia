
'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Bot } from 'lucide-react';
import ChatWidget from '@/components/chat/ChatWidget';

// This is a placeholder for a more dedicated chat interface in the future.
// For now, we can prompt the user to use the global chat widget which will have the right context.

export default function ValeriaDashboardPage() {
    const { userProfile, claims } = useAuth();

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-bold font-headline">Bienvenido a Valeria Premium</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                        Hola {userProfile?.name}, gracias por suscribirte al <strong>Plan {claims?.valeria_plan}</strong>. Ya tienes acceso a las funcionalidades avanzadas de Valeria.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-muted rounded-lg">
                        <Bot className="w-16 h-16 text-muted-foreground mb-4"/>
                        <h3 className="text-xl font-bold">Tu asistente está listo</h3>
                        <p className="text-muted-foreground mt-2 max-w-md">
                            Puedes empezar a chatear con Valeria ahora mismo usando el widget de chat en la esquina inferior derecha de la pantalla.
                        </p>
                    </div>
                </CardContent>
            </Card>

             {/* This component is rendered globally by the layout but shown here as a visual cue */}
            <div className="hidden">
                <ChatWidget />
            </div>
        </div>
    );
}
