'use client';

import { useState, useTransition } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Briefcase, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import JobForm from './JobForm';
import { createJobPostingAction } from '@/lib/job-posting/infrastructure/nextjs/job-posting.server-actions';
import { JobPostingFormValues, JobPostingFormSchema } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

type GuestJobCreationSheetProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

const SignUpSchema = z.object({
    name: z.string().min(2, "El nombre es requerido."),
    email: z.string().email("Debe ser un email válido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type SignUpFormValues = z.infer<typeof SignUpSchema>;

export default function GuestJobCreationSheet({ isOpen, onOpenChange }: GuestJobCreationSheetProps) {
    const [step, setStep] = useState(1);
    const { signUpWithEmail, user, userProfile } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();

    const signUpForm = useForm<SignUpFormValues>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: { name: '', email: '', password: '' },
    });

    const jobForm = useForm<JobPostingFormValues>({
        resolver: zodResolver(JobPostingFormSchema),
        defaultValues: { status: 'PENDING_REVIEW' },
    });

    const handleSignUp = async (values: SignUpFormValues) => {
        startTransition(async () => {
            const { error } = await signUpWithEmail(values.name, values.email, values.password, 'Advertiser');
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Ahora puedes publicar tu oferta de empleo.' });
                setStep(2);
            }
        });
    };
    
    const handleJobSubmit = async (values: JobPostingFormValues) => {
        startTransition(async () => {
            try {
                if (!user || !userProfile) throw new Error("User not authenticated");

                const imageInput = document.querySelector<HTMLInputElement>('input[name="imageFile"]');
                const imageFile = imageInput?.files?.[0];
                const companyLogoInput = document.querySelector<HTMLInputElement>('input[name="companyLogoFile"]');
                const companyLogoFile = companyLogoInput?.files?.[0];

                const createData = {
                    ...values,
                    creatorId: user.uid,
                    creatorRole: 'advertiser' as const,
                    status: 'PENDING_REVIEW' as const,
                };
                const result = await createJobPostingAction(createData, imageFile, companyLogoFile);

                if (result.success) {
                    toast({
                        title: "¡Oferta Enviada!",
                        description: "Tu oferta de empleo ha sido enviada para revisión. Un administrador la aprobará pronto.",
                    });
                    onOpenChange(false);
                    setTimeout(() => {
                        setStep(1);
                        signUpForm.reset();
                        jobForm.reset();
                    }, 300);
                } else {
                    throw new Error(result.error || "No se pudo crear la oferta.");
                }

            } catch(e) {
                 const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
                 toast({ variant: 'destructive', title: 'Error al Publicar', description: errorMessage });
            }
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full">
                {step === 1 && (
                    <>
                        <SheetHeader>
                            <SheetTitle>Paso 1: Crea una cuenta de empleador</SheetTitle>
                            <SheetDescription>Es gratis y solo toma un minuto. Así podrás gestionar tus ofertas de empleo.</SheetDescription>
                        </SheetHeader>
                        <div className="py-4">
                            <Form {...signUpForm}>
                                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                                    <FormField control={signUpForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={signUpForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={signUpForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Crear cuenta y continuar
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </>
                )}
                {step === 2 && user && (
                    <>
                        <SheetHeader>
                            <SheetTitle>Paso 2: Publica tu Oferta de Empleo</SheetTitle>
                            <SheetDescription>Completa los detalles de la vacante para que los candidatos la encuentren.</SheetDescription>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100vh-150px)] pr-6">
                            <div className="py-4">
                               <JobForm isPending={isSubmitting} onSubmit={handleJobSubmit} form={jobForm} />
                            </div>
                        </ScrollArea>
                        <SheetFooter className="pt-4 mt-4 border-t">
                            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
                            <Button onClick={jobForm.handleSubmit(handleJobSubmit)} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Publicar Oferta
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
