
'use client';

import React, { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SheetFooter, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { ServiceListing } from '@/lib/types';

const ServiceListingFormSchema = z.object({
    title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
    description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
    category: z.string().min(1, "Debes seleccionar una categoría."),
    city: z.string().min(1, "La ciudad es obligatoria."),
    price: z.coerce.number().min(0, "El precio no puede ser negativo."),
    priceType: z.enum(['per_hour', 'fixed', 'per_project'], {
        required_error: "Debes seleccionar un tipo de precio."
    }),
    contactPhone: z.string().min(7, "El teléfono de contacto es obligatorio."),
    contactEmail: z.string().email("El email de contacto debe ser válido."),
    contactViaWhatsApp: z.boolean().default(false),
    serviceImageFile: z.custom<FileList>().optional(),
});

type ServiceListingFormValues = z.infer<typeof ServiceListingFormSchema>;

type ServiceFormProps = {
    listingToEdit?: ServiceListing | null;
    onFormSubmit: () => void;
};

export default function ServiceForm({ listingToEdit, onFormSubmit }: ServiceFormProps) {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const form = useForm<ServiceListingFormValues>({
        resolver: zodResolver(ServiceListingFormSchema),
    });

    useEffect(() => {
        if (listingToEdit) {
            form.reset({
                ...listingToEdit,
                price: listingToEdit.price || 0,
                contactViaWhatsApp: listingToEdit.contactViaWhatsApp || false,
            });
        } else {
            form.reset({
                title: '',
                description: '',
                category: '',
                city: '',
                price: 0,
                priceType: 'fixed',
                contactPhone: userProfile?.businessProfile?.phone || '',
                contactEmail: userProfile?.email || '',
                contactViaWhatsApp: true,
            });
        }
    }, [listingToEdit, form, userProfile]);

    const onSubmit = async (values: ServiceListingFormValues) => {
        if (!user) return;
        startTransition(async () => {
            try {
                const formData = new FormData();
                Object.entries(values).forEach(([key, value]) => {
                    if (key !== 'serviceImageFile' && value !== undefined && value !== null) {
                        formData.append(key, String(value));
                    }
                });
                if (values.serviceImageFile && values.serviceImageFile.length > 0) {
                    formData.append('serviceImageFile', values.serviceImageFile[0]);
                }

                const idToken = await user.getIdToken();
                const endpoint = listingToEdit ? `/api/services/${listingToEdit.id}` : '/api/services';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${idToken}` },
                    body: formData,
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error?.message || 'Error al guardar el servicio');
                }

                toast({
                    title: `Servicio ${listingToEdit ? 'actualizado' : 'creado'}`,
                    description: `Tu servicio ha sido ${listingToEdit ? 'actualizado' : 'enviado para revisión'}.`,
                });

                onFormSubmit();

            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.' });
            }
        });
    };

    return (
        <>
            <ScrollArea className="h-[calc(100vh-150px)] pr-6">
                <div className="py-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título del Servicio</FormLabel><FormControl><Input placeholder="Ej: Clases de Guitarra a Domicilio" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción Detallada</FormLabel><FormControl><Textarea placeholder="Ofrezco clases para principiantes, todos los estilos..." rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="serviceImageFile" render={({ field }) => (<FormItem><FormLabel>Imagen del Servicio (Opcional)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormDescription>Sube una imagen representativa de tu servicio.</FormDescription><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Elige una categoría" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Clases Particulares">Clases Particulares</SelectItem><SelectItem value="Cuidado Personal">Cuidado Personal</SelectItem><SelectItem value="Limpieza y Hogar">Limpieza y Hogar</SelectItem><SelectItem value="Desarrollo Web y TI">Desarrollo Web y TI</SelectItem><SelectItem value="Diseño Gráfico">Diseño Gráfico</SelectItem><SelectItem value="Eventos">Eventos</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input placeholder="Ej: Madrid" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio (€)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="priceType" render={({ field }) => (<FormItem><FormLabel>Tipo de Precio</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Elige un tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="per_hour">Por Hora</SelectItem><SelectItem value="fixed">Precio Fijo</SelectItem><SelectItem value="per_project">Por Proyecto</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono de Contacto</FormLabel><FormControl><Input placeholder="+34 600 000 000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Email de Contacto</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField
                                control={form.control}
                                name="contactViaWhatsApp"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Aceptar contacto por WhatsApp</FormLabel>
                                            <FormDescription>
                                                Permite que los interesados te contacten directamente por WhatsApp.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </div>
            </ScrollArea>
            <SheetFooter>
                <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (listingToEdit ? 'Guardar Cambios' : 'Crear Servicio')}
                </Button>
            </SheetFooter>
        </>
    );
}
