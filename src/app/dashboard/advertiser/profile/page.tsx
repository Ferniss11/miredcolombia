'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateBusinessProfileAction } from "@/lib/user-actions";
import type { BusinessProfile } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const businessProfileSchema = z.object({
    businessName: z.string().min(2, { message: "El nombre del negocio debe tener al menos 2 caracteres." }),
    address: z.string().min(5, { message: "La dirección es obligatoria." }),
    phone: z.string().min(7, { message: "El número de teléfono es obligatorio." }),
    website: z.string().url({ message: "Debe ser una URL válida." }).or(z.literal("")).optional(),
    description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
});

type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

export default function AdvertiserProfilePage() {
    const { user, userProfile } = useAuth();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<BusinessProfileFormValues>({
        resolver: zodResolver(businessProfileSchema),
        defaultValues: {
            businessName: userProfile?.businessProfile?.businessName || "",
            address: userProfile?.businessProfile?.address || "",
            phone: userProfile?.businessProfile?.phone || "",
            website: userProfile?.businessProfile?.website || "",
            description: userProfile?.businessProfile?.description || "",
        },
    });

    async function onSubmit(data: BusinessProfileFormValues) {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para actualizar tu perfil.' });
            return;
        }

        startTransition(async () => {
            const result = await updateBusinessProfileAction(user.uid, data as BusinessProfile);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al actualizar', description: result.error });
            } else {
                toast({ title: 'Éxito', 'description': '¡Tu perfil de negocio ha sido actualizado!' });
            }
        });
    }

    return (
        <div>
            <h1 className="text-3xl font-bold font-headline mb-6">Perfil del Negocio</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Información de tu Negocio</CardTitle>
                    <CardDescription>Mantén tu perfil actualizado para que los clientes puedan encontrarte.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Negocio</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Mi Negocio increíble" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2">
                                    <Label>Nombre de Contacto</Label>
                                    <Input value={userProfile?.name || ''} readOnly disabled />
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Calle Falsa 123, Madrid" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+34 600 000 000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sitio Web</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://minegocio.es" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción del Negocio</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Describe tu negocio y lo que ofreces..." rows={5} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Cambios
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
