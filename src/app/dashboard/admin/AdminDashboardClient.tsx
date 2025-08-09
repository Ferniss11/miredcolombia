
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Building, Sparkles, Bot, MessageSquare, Bug, ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import DebugInfoCard from "@/components/debug/DebugInfoCard";
import type { AdminDashboardStats } from "@/lib/admin-actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GoogleAuthProvider } from "firebase/auth";

const passwordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});


export default function AdminDashboardClient({ stats }: { stats: AdminDashboardStats }) {
    const { user, userProfile, claims, linkPasswordToAccount } = useAuth();
    const [isLinking, startLinkingTransition] = useTransition();
    const { toast } = useToast();
    
    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: '', confirmPassword: '' }
    });

    async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
        startLinkingTransition(async () => {
            const result = await linkPasswordToAccount(data.password);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al vincular', description: result.error });
            } else {
                toast({ title: 'Éxito', description: '¡Contraseña establecida! Ahora puedes iniciar sesión con tu email y contraseña.' });
                passwordForm.reset();
                // We might need to close the dialog manually here if it doesn't close on its own
            }
        });
    }

    const hasPasswordProvider = user?.providerData.some(p => p.providerId === 'password');
    const hasGoogleProvider = user?.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);


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
                    <CardContent className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
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
             <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6"/>Seguridad de la Cuenta</CardTitle>
                        <CardDescription>Gestiona tus métodos de inicio de sesión.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!hasPasswordProvider && hasGoogleProvider ? (
                            <div className="flex items-center justify-between p-3 border rounded-md">
                                <div>
                                    <h4 className="font-semibold">Establecer Contraseña</h4>
                                    <p className="text-sm text-muted-foreground">Añade una contraseña para poder iniciar sesión también con tu email.</p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline"><KeyRound className="mr-2 h-4 w-4"/> Establecer Contraseña</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Establecer una nueva contraseña</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Introduce una contraseña para añadir el inicio de sesión con email a tu cuenta de Google.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <Form {...passwordForm}>
                                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                                <FormField
                                                    control={passwordForm.control}
                                                    name="password"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Nueva Contraseña</FormLabel>
                                                            <FormControl><Input type="password" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={passwordForm.control}
                                                    name="confirmPassword"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Confirmar Contraseña</FormLabel>
                                                            <FormControl><Input type="password" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <AlertDialogFooter className="pt-4">
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <Button type="submit" disabled={isLinking}>
                                                        {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                        Guardar Contraseña
                                                    </Button>
                                                </AlertDialogFooter>
                                            </form>
                                        </Form>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground">Ya tienes un método de inicio de sesión con contraseña configurado.</p>
                        )}
                    </CardContent>
                </Card>
             </div>
              <div className="grid gap-6 md:grid-cols-2">
                <DebugInfoCard title="Auth User Object" description="Datos del usuario desde Firebase Authentication." data={user} />
                <DebugInfoCard title="User Profile (Firestore)" description="Datos del perfil desde Firestore." data={userProfile} />
                <DebugInfoCard title="Auth Token Claims" description="Claims decodificados del token de autenticación (incluye el rol)." data={claims} />
            </div>
        </div>
    );
}

