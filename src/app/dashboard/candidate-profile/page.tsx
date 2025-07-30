
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useTransition, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateCandidateProfileAction } from '@/lib/user-actions';
import { CandidateProfileSchema, type CandidateProfileFormValues } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Briefcase, FileText, Upload, Eye } from 'lucide-react';
import Link from 'next/link';

export default function CandidateProfilePage() {
    const { user, userProfile, loading, refreshUserProfile } = useAuth();
    const [isPending, startTransition] = useTransition();
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
    
    // Make resume file required only if there isn't one already uploaded
    const isResumeRequired = !userProfile?.candidateProfile?.resumeUrl;
    
    async function onSubmit(data: CandidateProfileFormValues) {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para actualizar.' });
            return;
        }

        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append('professionalTitle', data.professionalTitle || '');
                formData.append('summary', data.summary || '');
                formData.append('skills', (data.skills || []).join(','));

                if (data.resumeFile && data.resumeFile.length > 0) {
                    formData.append('resumeFile', data.resumeFile[0]);
                } else if (isResumeRequired) {
                    toast({ variant: 'destructive', title: 'Archivo Requerido', description: 'Por favor, sube tu currículum en formato PDF.' });
                    return;
                }

                const result = await updateCandidateProfileAction(user.uid, formData);

                if (result.success) {
                    toast({ title: 'Éxito', description: 'Tu perfil ha sido actualizado.' });
                    await refreshUserProfile();
                    form.reset({ ...form.getValues(), resumeFile: undefined });
                } else {
                    // Display the specific server error
                    toast({ variant: 'destructive', title: 'Error al Guardar', description: result.error });
                }

            } catch (error) {
                 const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió durante la operación.";
                 toast({ variant: 'destructive', title: 'Error Inesperado en Cliente', description: errorMessage });
            }
        });
    }

    if (loading) {
        return <div><Loader2 className="animate-spin" /> Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Briefcase className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Mi Perfil Profesional</h1>
            </div>

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
