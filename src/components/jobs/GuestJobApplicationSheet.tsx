
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Briefcase, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateCandidateProfileAction } from '@/lib/user-actions';
import { CandidateProfileSchema, type CandidateProfileFormValues } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

type GuestJobApplicationSheetProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    jobId: string;
    jobTitle: string;
};

const SignUpSchema = z.object({
    name: z.string().min(2, "El nombre es requerido."),
    email: z.string().email("Debe ser un email válido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type SignUpFormValues = z.infer<typeof SignUpSchema>;

// -- Step 1: Sign-Up Form --
const SignUpStep = ({ form, onSubmit, isSubmitting }: { form: UseFormReturn<SignUpFormValues>, onSubmit: (v: SignUpFormValues) => void, isSubmitting: boolean }) => (
    <>
        <SheetHeader>
            <SheetTitle>Paso 1: Crea tu cuenta para postular</SheetTitle>
            <SheetDescription>Es gratis y solo toma un minuto. Así podrás gestionar tus postulaciones.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear cuenta y continuar
                    </Button>
                </form>
            </Form>
        </div>
    </>
);

// -- Step 2: Candidate Profile Form --
const ProfileStep = ({ form, onSubmit, isSubmitting, jobTitle }: { form: UseFormReturn<CandidateProfileFormValues>, onSubmit: (v: CandidateProfileFormValues) => void, isSubmitting: boolean, jobTitle: string }) => {
    useEffect(() => {
        form.setValue('professionalTitle', jobTitle);
    }, [jobTitle, form]);
    
    return (
        <>
            <SheetHeader>
                <SheetTitle>Paso 2: Completa tu perfil para aplicar</SheetTitle>
                <SheetDescription>Sube tu CV y completa tu perfil. Esto es lo que verá el empleador.</SheetDescription>
            </SheetHeader>
             <ScrollArea className="h-[calc(100vh-170px)] pr-6 -mr-6">
                <div className="py-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <FormField control={form.control} name="professionalTitle" render={({ field }) => (<FormItem><FormLabel>Título Profesional</FormLabel><FormControl><Input placeholder="Ej: Desarrollador Full-Stack" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="summary" render={({ field }) => (<FormItem><FormLabel>Resumen (Opcional)</FormLabel><FormControl><Textarea placeholder="Breve resumen de tu experiencia..." rows={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="skills" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Habilidades (Opcional)</FormLabel>
                                    <FormControl><Input placeholder="Ej: React, Figma, Contabilidad..." value={Array.isArray(field.value) ? field.value.join(', ') : ''} onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                             )} />
                             <FormField control={form.control} name="resumeFile" render={({ field: { value, onChange, ...fieldProps }}) => (
                                 <FormItem>
                                    <FormLabel>Currículum (PDF) <span className="text-destructive">*</span></FormLabel>
                                    <FormControl><Input {...fieldProps} type="file" required accept="application/pdf" onChange={(event) => onChange(event.target.files)}/></FormControl>
                                    <FormMessage />
                                 </FormItem>
                             )} />
                             <SheetFooter className="pt-4 sticky bottom-0 bg-background">
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Briefcase className="mr-2 h-4 w-4"/>}
                                    Completar Perfil y Postular
                                </Button>
                             </SheetFooter>
                        </form>
                    </Form>
                </div>
            </ScrollArea>
        </>
    );
};


export default function GuestJobApplicationSheet({ isOpen, onOpenChange, jobId, jobTitle }: GuestJobApplicationSheetProps) {
    const [step, setStep] = useState(1);
    const { signUpWithEmail, user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();

    const signUpForm = useForm<SignUpFormValues>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: { name: '', email: '', password: '' },
    });

    const profileForm = useForm<CandidateProfileFormValues>({
        resolver: zodResolver(CandidateProfileSchema),
        defaultValues: {
            professionalTitle: '',
            summary: '',
            skills: [],
            resumeFile: undefined,
        }
    });

    useEffect(() => {
        if (!isOpen) {
            // Reset to step 1 when sheet is closed externally
            setTimeout(() => setStep(1), 300);
        }
    }, [isOpen]);

    const handleSignUp = async (values: SignUpFormValues) => {
        startTransition(async () => {
            const { error, user: newUser } = await signUpWithEmail(values.name, values.email, values.password, 'User');
            if (error || !newUser) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error || "No se pudo crear el usuario." });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Ahora, completa tu perfil para postular.' });
                setStep(2);
            }
        });
    };
    
    const handleProfileAndApply = async (values: CandidateProfileFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error de Autenticación', description: 'Tu sesión ha expirado. Por favor, cierra esto e intenta de nuevo.' });
            return;
        }
        if (!values.resumeFile || values.resumeFile.length === 0) {
            profileForm.setError('resumeFile', { message: 'El CV es obligatorio para postular.' });
            return;
        }

        startTransition(async () => {
            try {
                // Get fresh token right before the actions
                const idToken = await user.getIdToken(true);

                // 1. Update Profile (upload resume)
                const formData = new FormData();
                formData.append('professionalTitle', values.professionalTitle || '');
                formData.append('summary', values.summary || '');
                formData.append('skills', Array.isArray(values.skills) ? values.skills.join(',') : '');
                if (values.resumeFile) formData.append('resumeFile', values.resumeFile[0]);
                
                // Pass the fresh token to the action
                const profileResult = await updateCandidateProfileAction(user.uid, formData, idToken);
                if (!profileResult.success) throw new Error(profileResult.error || 'No se pudo actualizar tu perfil.');

                // 2. Submit Application
                const applyResponse = await fetch(`/api/jobs/${jobId}/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                });
                const applyResult = await applyResponse.json();
                if (!applyResponse.ok) throw new Error(applyResult.error?.message || 'No se pudo enviar tu postulación.');

                toast({
                    title: '¡Postulación Enviada con Éxito!',
                    description: `Tu perfil se ha guardado y tu solicitud para "${jobTitle}" ha sido enviada.`,
                });
                
                onOpenChange(false);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
                toast({ variant: 'destructive', title: 'Error en la Postulación', description: errorMessage });
            }
        });
    }
    
    // Render logic
    const renderContent = () => {
        if (step === 2) {
             return <ProfileStep form={profileForm} onSubmit={handleProfileAndApply} isSubmitting={isSubmitting} jobTitle={jobTitle} />;
        }
        return <SignUpStep form={signUpForm} onSubmit={handleSignUp} isSubmitting={isSubmitting} />;
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full p-6 flex flex-col">
                {renderContent()}
            </SheetContent>
        </Sheet>
    );
}
