
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Building, Sparkles, Bot, MessageSquare, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import DebugInfoCard from "@/components/debug/DebugInfoCard";
import type { AdminDashboardStats } from "@/lib/admin-actions";

export default function AdminDashboardClient({ stats }: { stats: AdminDashboardStats }) {
    const { user, userProfile } = useAuth();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline mb-6">Resumen de Administración</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.userCount}</div>
                        <p className="text-xs text-muted-foreground">Total de usuarios en la plataforma.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Negocios Aprobados</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.businessCount}</div>
                        <p className="text-xs text-muted-foreground">Negocios visibles en el directorio.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Entradas Publicadas</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.blogPostCount}</div>
                        <p className="text-xs text-muted-foreground">Total de artículos en el blog.</p>
                    </CardContent>
                </Card>
            </div>
             <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                         <CardDescription>Herramientas y accesos directos para la administración del sitio.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <Button asChild>
                           <Link href="/dashboard/admin/content">
                             <Sparkles className="mr-2 h-4 w-4"/>
                             Suite de Contenido IA
                           </Link>
                        </Button>
                         <Button asChild variant="outline">
                           <Link href="/dashboard/admin/blog">
                            <FileText className="mr-2 h-4 w-4"/>
                             Gestionar Blog
                           </Link>
                        </Button>
                         <Button asChild variant="outline">
                           <Link href="/dashboard/admin/agent">
                             <Bot className="mr-2 h-4 w-4"/>
                             Agente Global
                           </Link>
                        </Button>
                        <Button asChild variant="outline">
                           <Link href="/dashboard/admin/conversations">
                             <MessageSquare className="mr-2 h-4 w-4"/>
                             Conversaciones
                           </Link>
                        </Button>
                        <Button asChild variant="outline">
                           <Link href="/dashboard/admin/directory">
                             <Building className="mr-2 h-4 w-4"/>
                             Gestionar Directorio
                           </Link>
                        </Button>
                         <Button asChild variant="outline" className="text-orange-500 border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-600">
                           <Link href="/dashboard/admin/debug">
                             <Bug className="mr-2 h-4 w-4"/>
                             Depuración
                           </Link>
                        </Button>
                    </CardContent>
                </Card>
             </div>
              <div className="grid gap-6 md:grid-cols-2">
                <DebugInfoCard title="Auth User Object" description="Datos del usuario desde Firebase Authentication." data={user} />
                <DebugInfoCard title="User Profile Object" description="Datos del perfil desde Firestore." data={userProfile} />
            </div>
        </div>
    );
}
