
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useTransition, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateCandidateProfileAction } from '@/lib/user-actions';
import { CandidateProfileSchema, type CandidateProfileFormValues } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Briefcase, FileText, Upload, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function CandidateProfilePage() {
    const { userProfile, loading, refreshUserProfile } = useAuth();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<CandidateProfileFormValues>({
        resolver: zodResolver(CandidateProfileSchema),
        defaultValues: {
            professionalTitle: '',
            summary: '',
            skills: [],
        },
    });

    useEffect(() => {
        if (userProfile?.candidateProfile) {
            form.reset({
                professionalTitle: userProfile.candidateProfile.professionalTitle || '',
                summary: userProfile.candidateProfile.summary || '',
                skills: userProfile.candidateProfile.skills || [],
            });
        }
    }, [userProfile, form]);

    async function onSubmit(data: CandidateProfileFormValues) {
        if (!userProfile) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append('professionalTitle', data.professionalTitle || '');
            formData.append('summary', data.summary || '');
            formData.append('skills', (data.skills || []).join(','));

            if (fileInputRef.current?.files?.[0]) {
                formData.append('resumeFile', fileInputRef.current.files[0]);
            }

            const result = await updateCandidateProfileAction(userProfile.uid, formData);

            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Éxito', description: 'Tu perfil ha sido actualizado.' });
                await refreshUserProfile();
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
                                                // Convert array to string for input, and string back to array on change
                                                value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                                onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                                            />
                                        </FormControl>
                                        <FormDescription>Separa tus habilidades por comas.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormItem>
                                <FormLabel>Currículum (PDF)</FormLabel>
                                {userProfile?.candidateProfile?.resumeUrl ? (
                                    <div className="flex items-center gap-4 p-2 border rounded-md">
                                        <FileText className="h-6 w-6 text-primary"/>
                                        <p className="text-sm font-medium flex-grow">CV Actual Cargado</p>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={userProfile.candidateProfile.resumeUrl} target="_blank" rel="noopener noreferrer">
                                                <Eye className="mr-2 h-4 w-4"/> Ver
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => {/* TODO: Implement delete */}}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No has subido ningún currículum todavía.</p>
                                )}
                                <FormControl>
                                    <Input
                                        type="file"
                                        accept="application/pdf"
                                        ref={fileInputRef}
                                        className="mt-2"
                                    />
                                </FormControl>
                                <FormDescription>
                                    {userProfile?.candidateProfile?.resumeUrl ? "Sube un nuevo archivo para reemplazar el actual." : "Sube tu CV en formato PDF."}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
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
