

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useTransition, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateCandidateProfileAction } from '@/lib/user-actions';
import { CandidateProfileSchema, type CandidateProfileFormValues } from '@/lib/types';
import * as z from "zod";


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Briefcase, FileText, Upload, Eye, KeyRound, CheckCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { GoogleAuthProvider } from 'firebase/auth';


const passwordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});


export default function CandidateProfilePage() {
    const { user, userProfile, loading, refreshUserProfile, linkPasswordToAccount } = useAuth();
    const [isPending, startTransition] = useTransition();
    const [isLinking, startLinkingTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<CandidateProfileFormValues>({
        resolver: zodResolver(CandidateProfileSchema),
        defaultValues: {
            professionalTitle: '',
            summary: '',
            skills: [],
            resumeFile: undefined,
        },
    });
    
    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: '', confirmPassword: '' }
    });

    const isResumeRequired = !userProfile?.candidateProfile?.resumeUrl;
    
    useEffect(() => {
        if (userProfile?.candidateProfile) {
            form.reset({
                professionalTitle: userProfile.candidateProfile.professionalTitle || '',
                summary: userProfile.candidateProfile.summary || '',
                skills: Array.isArray(userProfile.candidateProfile.skills) ? userProfile.candidateProfile.skills : [],
                resumeFile: undefined,
            });
        }
    }, [userProfile, form]);
    
    async function onSubmit(data: CandidateProfileFormValues) {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para actualizar.' });
            return;
        }

        const resumeFile = data.resumeFile?.[0];
        if (isResumeRequired && !resumeFile) {
             toast({ variant: 'destructive', title: 'Archivo Requerido', description: 'Por favor, sube tu currículum en formato PDF.' });
             return;
        }

        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append('professionalTitle', data.professionalTitle || '');
                formData.append('summary', data.summary || '');
                formData.append('skills', Array.isArray(data.skills) ? data.skills.join(',') : '');

                if (resumeFile) {
                    formData.append('resumeFile', resumeFile);
                }

                const result = await updateCandidateProfileAction(user.uid, formData);

                if (result.success) {
                    toast({ title: 'Éxito', description: 'Tu perfil ha sido actualizado.' });
                    await refreshUserProfile();
                    form.reset({ ...form.getValues(), resumeFile: undefined });
                } else {
                    toast({ variant: 'destructive', title: 'Error al Guardar', description: result.error });
                }

            } catch (error) {
                 const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió durante la operación.";
                 toast({ variant: 'destructive', title: 'Error Inesperado en Cliente', description: errorMessage });
            }
        });
    }

    async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
        startLinkingTransition(async () => {
            const result = await linkPasswordToAccount(data.password);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al vincular', description: result.error });
            } else {
                toast({ title: 'Éxito', description: '¡Contraseña establecida! Ahora puedes iniciar sesión con tu email y contraseña.' });
                await refreshUserProfile(); 
                passwordForm.reset();
            }
        });
    }

    if (loading || !user) {
        return <div><Loader2 className="animate-spin" /> Cargando...</div>;
    }

    const hasPasswordProvider = user.providerData.some(p => p.providerId === 'password');
    const hasGoogleProvider = user.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Briefcase className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Mi Perfil Profesional</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6"/>Seguridad de la Cuenta</CardTitle>
                    <CardDescription>Gestiona tus métodos de inicio de sesión.</CardDescription>
                </CardHeader>
                <CardContent>
                    {hasPasswordProvider ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-md border border-green-200">
                            <CheckCircle className="h-5 w-5"/>
                            <p className="text-sm font-medium">Tienes una contraseña establecida para tu cuenta.</p>
                        </div>
                    ) : (
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
                    )}
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen Profesional</CardTitle>
                            <CardDescription>Esta es tu carta de presentación. Haz que cuente.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="professionalTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título Profesional</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Desarrollador Full-Stack, Diseñador UX/UI" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="summary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sobre Mí</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Un breve resumen sobre tu experiencia, pasiones y lo que buscas profesionalmente." rows={5} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Habilidades y CV</CardTitle>
                            <CardDescription>Destaca tus competencias y adjunta tu currículum.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="skills"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Habilidades Principales</FormLabel>
                                        <FormControl>
                                             <Input
                                                placeholder="Ej: React, Figma, Contabilidad..."
                                                value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                                onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                                            />
                                        </FormControl>
                                        <FormDescription>Separa tus habilidades por comas.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="resumeFile"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Currículum (PDF)</FormLabel>
                                    {userProfile?.candidateProfile?.resumeUrl && (
                                        <div className="flex items-center gap-4 p-2 border rounded-md">
                                            <FileText className="h-6 w-6 text-primary"/>
                                            <p className="text-sm font-medium flex-grow">CV Actual Cargado</p>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={userProfile.candidateProfile.resumeUrl} target="_blank" rel="noopener noreferrer">
                                                    <Eye className="mr-2 h-4 w-4"/> Ver
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(event) => onChange(event.target.files)}
                                            className="mt-2"
                                            required={isResumeRequired}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {userProfile?.candidateProfile?.resumeUrl ? "Sube un nuevo archivo para reemplazar el actual." : "Sube tu CV en formato PDF. Es obligatorio."}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Guardar Perfil
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
