
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, HandCoins, Bug, Bot, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboardPage() {
    const { user, userProfile } = useAuth();

    return (
        <div className="space-y-6">
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
                         <CardDescription>Herramientas y accesos directos para la administración del sitio.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <Button asChild>
                           <Link href="/dashboard/admin/content">
                             Suite de Contenido IA
                           </Link>
                        </Button>
                         <Button asChild variant="outline">
                           <Link href="/dashboard/admin/blog">
                             Gestionar Blog
                           </Link>
                        </Button>
                         <Button asChild variant="secondary">
                           <Link href="/dashboard/admin/agent">
                             <Bot className="mr-2 h-4 w-4"/>
                             Gestionar Agente
                           </Link>
                        </Button>
                        <Button asChild variant="outline" className="text-indigo-600 border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                           <Link href="/dashboard/admin/directory">
                             <Building className="mr-2 h-4 w-4"/>
                             Gestionar Directorio
                           </Link>
                        </Button>
                         <Button asChild variant="destructive" className="bg-orange-500 hover:bg-orange-600 border-orange-500">
                           <Link href="/dashboard/admin/debug">
                             <Bug className="mr-2 h-4 w-4"/>
                             Depuración de Herramientas
                           </Link>
                        </Button>
                    </CardContent>
                </Card>
             </div>
             <div className="mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Información de Depuración del Usuario</CardTitle>
                        <CardDescription>
                        Estos son los datos que se están leyendo de Firebase Auth y Firestore.
                        Usa esto para verificar que tu rol es 'Admin' antes de intentar guardar un post.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <div className="space-y-4 min-w-[600px]">
                                <div>
                                    <h3 className="font-semibold">Objeto User (de Firebase Auth)</h3>
                                    <pre className="mt-2 w-full overflow-x-auto rounded-md bg-muted p-4 text-sm">
                                        {user ? JSON.stringify(user, null, 2) : 'No hay usuario autenticado.'}
                                    </pre>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Objeto UserProfile (de Firestore)</h3>
                                    <pre className="mt-2 w-full overflow-x-auto rounded-md bg-muted p-4 text-sm">
                                        {userProfile ? JSON.stringify(userProfile, null, 2) : 'No se encontró perfil en Firestore.'}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
