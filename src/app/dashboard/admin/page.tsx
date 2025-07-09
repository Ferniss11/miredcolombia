import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, HandCoins } from "lucide-react";

export default function AdminDashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold font-headline mb-6">Resumen de Administración</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,254</div>
                        <p className="text-xs text-muted-foreground">+50 desde la semana pasada</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">320</div>
                        <p className="text-xs text-muted-foreground">+12 desde el mes pasado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Publicaciones del Blog</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">42</div>
                        <p className="text-xs text-muted-foreground">+5 nuevas este mes</p>
                    </CardContent>
                </Card>
            </div>
             <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Usa la barra lateral para navegar a la Suite de Contenido IA o gestionar usuarios.</p>
                    </CardContent>
                </Card>
             </div>
        </div>
    );
}
