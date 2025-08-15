
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
        // Pre-fill the professional title with the job title
        form.setValue('professionalTitle', jobTitle);
    }, [jobTitle, form]);
    
    return (
        <>
            <SheetHeader>
                <SheetTitle>Paso 2: Completa tu perfil para aplicar</SheetTitle>
                <SheetDescription>Sube tu CV y completa tu perfil. Esto es lo que verá el empleador.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-120px)] pr-6">
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
                             <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Briefcase className="mr-2 h-4 w-4"/>}
                                Completar Perfil y Postular
                            </Button>
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
    });

    // Effect to advance to step 2 if the user signs up successfully
    useEffect(() => {
        if (user && step === 1) {
            setStep(2);
        }
    }, [user, step]);


    const handleSignUp = async (values: SignUpFormValues) => {
        startTransition(async () => {
            const { error } = await signUpWithEmail(values.name, values.email, values.password, 'User');
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Ahora, completa tu perfil para postular.' });
                // The useEffect will handle moving to step 2
            }
        });
    };
    
    const handleProfileAndApply = async (values: CandidateProfileFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.' });
            return;
        }
        if (!values.resumeFile || values.resumeFile.length === 0) {
            profileForm.setError('resumeFile', { message: 'El CV es obligatorio para postular.' });
            return;
        }

        startTransition(async () => {
            try {
                // 1. Update Profile (upload resume)
                const formData = new FormData();
                formData.append('professionalTitle', values.professionalTitle || '');
                formData.append('summary', values.summary || '');
                formData.append('skills', Array.isArray(values.skills) ? values.skills.join(',') : '');
                if (values.resumeFile) formData.append('resumeFile', values.resumeFile[0]);
                
                const profileResult = await updateCandidateProfileAction(user.uid, formData);
                if (!profileResult.success) throw new Error(profileResult.error || 'No se pudo actualizar tu perfil.');

                // 2. Submit Application
                const idToken = await user.getIdToken();
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
                setTimeout(() => setStep(1), 300);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
                toast({ variant: 'destructive', title: 'Error en la Postulación', description: errorMessage });
            }
        });
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => {
            onOpenChange(open);
            // Reset to step 1 when sheet is closed
            if (!open) {
                setTimeout(() => setStep(1), 300);
            }
        }}>
            <SheetContent className="sm:max-w-xl w-full p-0">
                 <div className="p-6">
                    {step === 1 && !user && (
                        <SignUpStep form={signUpForm} onSubmit={handleSignUp} isSubmitting={isSubmitting} />
                    )}
                    {step === 2 && user && (
                        <ProfileStep form={profileForm} onSubmit={handleProfileAndApply} isSubmitting={isSubmitting} jobTitle={jobTitle} />
                    )}
                 </div>
            </SheetContent>
        </Sheet>
    );
}
