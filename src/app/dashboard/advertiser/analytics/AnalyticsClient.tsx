
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBusinessAnalyticsAction } from '@/lib/user-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart2, MessageSquare, BrainCircuit, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { BusinessAnalytics } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(value);
};

export default function AnalyticsClient() {
    const { user, loading: authLoading } = useAuth();
    const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getBusinessAnalyticsAction(user.uid).then(data => {
                setAnalytics(data);
                setIsLoading(false);
            });
        } else if (!authLoading) {
            setIsLoading(false); // Not logged in
        }
    }, [user, authLoading]);

    if (isLoading || authLoading) {
        return (
             <div className="space-y-6">
                 <Skeleton className="h-8 w-1/2" />
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
                 <Skeleton className="h-40 w-full" />
             </div>
        );
    }
    
    if (!analytics) {
        return <div>No se pudieron cargar las analíticas.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <BarChart2 className="h-8 w-8 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">Analíticas de IA</h1>
            </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Coste Total de IA (para ti)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(analytics.totalFinalCost)}</div>
                        <p className="text-xs text-muted-foreground">Coste real + {analytics.profitMargin}% de margen.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversaciones Totales</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalConversations}</div>
                        <p className="text-xs text-muted-foreground">Chats iniciados por clientes.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tokens Usados</CardTitle>
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalTokens.toLocaleString('es-ES')}</div>
                        <p className="text-xs text-muted-foreground">Total de tokens de entrada y salida.</p>
                    </CardContent>
                </Card>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Desglose del Consumo</CardTitle>
                    <CardDescription>Detalles sobre el uso de la inteligencia artificial por parte de tu agente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Información de Consumo</AlertTitle>
                        <AlertDescription className="flex flex-col gap-2 mt-4">
                           <div className="flex justify-between items-center text-sm">
                               <span className="text-muted-foreground">Tokens de Entrada (Input):</span>
                               <strong className="font-mono">{analytics.totalInputTokens.toLocaleString('es-ES')}</strong>
                           </div>
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-muted-foreground">Tokens de Salida (Output):</span>
                               <strong className="font-mono">{analytics.totalOutputTokens.toLocaleString('es-ES')}</strong>
                           </div>
                            <div className="flex justify-between items-center text-sm pt-2 border-t mt-2">
                               <span className="text-muted-foreground">Margen de Beneficio de la Plataforma:</span>
                               <strong className="font-mono text-primary">{analytics.profitMargin}%</strong>
                           </div>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

        </div>
    );
}
