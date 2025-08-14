
'use client';

import { useState, useTransition } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, Handshake } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ServiceForm from './ServiceForm';

type GuestServiceCreationSheetProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

const SignUpSchema = z.object({
    name: z.string().min(2, "El nombre es requerido."),
    email: z.string().email("Debe ser un email válido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type SignUpFormValues = z.infer<typeof SignUpSchema>;

export default function GuestServiceCreationSheet({ isOpen, onOpenChange }: GuestServiceCreationSheetProps) {
    const [step, setStep] = useState(1);
    const { signUpWithEmail, user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();

    const signUpForm = useForm<SignUpFormValues>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: { name: '', email: '', password: '' },
    });

    const handleSignUp = async (values: SignUpFormValues) => {
        startTransition(async () => {
            const { error } = await signUpWithEmail(values.name, values.email, values.password, 'User');
            if (error) {
                toast({ variant: 'destructive', title: 'Error de Registro', description: error });
            } else {
                toast({ title: '¡Cuenta Creada!', description: 'Ahora puedes publicar tu servicio.' });
                setStep(2);
            }
        });
    };

    const handleSuccess = () => {
        onOpenChange(false);
        // Reset state for next time
        setTimeout(() => {
            setStep(1);
            signUpForm.reset();
        }, 300);
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full">
                {step === 1 && (
                    <>
                        <SheetHeader>
                            <SheetTitle>Paso 1: Crea tu cuenta</SheetTitle>
                            <SheetDescription>Necesitas una cuenta para publicar un servicio. ¡Es rápido!</SheetDescription>
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
                            <SheetTitle>Paso 2: Describe tu servicio</SheetTitle>
                            <SheetDescription>¡Ya casi! Completa los detalles de tu servicio para que la comunidad pueda encontrarlo.</SheetDescription>
                        </SheetHeader>
                        <ServiceForm onFormSubmit={handleSuccess} />
                    </>
                )}
                {step === 3 && (
                     <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold font-headline">¡Servicio Enviado!</h2>
                        <p className="text-muted-foreground mt-2">
                           Tu servicio ha sido enviado para revisión. Un administrador lo aprobará pronto.
                           Gracias por unirte a la comunidad.
                        </p>
                        <Button onClick={handleSuccess} className="mt-6">Cerrar</Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
