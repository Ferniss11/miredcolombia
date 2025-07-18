
'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Scale, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PlatformCosts, PlatformConfig } from '@/lib/types';
import { savePlatformConfigAction } from '@/lib/platform-actions';

type EconomicsClientProps = {
    initialCosts: PlatformCosts;
    initialConfig: PlatformConfig;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4 }).format(value);
};

export default function EconomicsClient({ initialCosts, initialConfig }: EconomicsClientProps) {
    const { toast } = useToast();
    const [isSaving, startSavingTransition] = useTransition();
    const [costs, setCosts] = useState<PlatformCosts>(initialCosts);
    const [config, setConfig] = useState<PlatformConfig>(initialConfig);

    const handleSaveConfig = () => {
        startSavingTransition(async () => {
            const result = await savePlatformConfigAction(config);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Éxito', description: 'La configuración de la plataforma ha sido guardada.' });
            }
        });
    };
    
    const projectedRevenue = costs.totalCost + (costs.totalCost * (config.profitMarginPercentage / 100));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Scale className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">IA Económico</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resumen Financiero de la IA</CardTitle>
                    <CardDescription>Análisis de los costes y proyecciones de ingresos de los servicios de IA de la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Coste Total de IA</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(costs.totalCost)}</div>
                            <p className="text-xs text-muted-foreground">Suma de chats y generación de contenido.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Margen de Beneficio</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{config.profitMarginPercentage}%</div>
                            <p className="text-xs text-muted-foreground">Configurado por el administrador.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingreso Proyectado</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(projectedRevenue)}</div>
                            <p className="text-xs text-muted-foreground">Coste + Margen de Beneficio.</p>
                        </CardContent>
                    </Card>
                </CardContent>
                 <CardContent>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Desglose de Costes</AlertTitle>
                        <AlertDescription className="flex flex-col gap-1 mt-2">
                           <span className="flex justify-between">Coste de Conversaciones: <strong className="font-mono">{formatCurrency(costs.chatCost)}</strong></span>
                           <span className="flex justify-between">Coste de Contenido (Blog): <strong className="font-mono">{formatCurrency(costs.contentCost)}</strong></span>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Márgenes</CardTitle>
                    <CardDescription>Establece el margen de beneficio que se aplicará sobre los costes de la IA para calcular el precio final al usuario.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 max-w-sm">
                        <Label htmlFor="profit-margin">Margen de Beneficio (%)</Label>
                        <Input
                            id="profit-margin"
                            type="number"
                            value={config.profitMarginPercentage}
                            onChange={(e) => setConfig({ ...config, profitMarginPercentage: Number(e.target.value) })}
                            placeholder="Ej: 15"
                        />
                    </div>
                     <Button onClick={handleSaveConfig} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Configuración
                    </Button>
                </CardContent>
            </Card>

        </div>
    );
}
