// src/components/inmobiliaria/PropertyForm.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
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
import { Loader2, MapPin } from 'lucide-react';
import type { Property } from '@/lib/real-estate/domain/property.entity';
import { Checkbox } from '../ui/checkbox';
import LocationPickerModal from './LocationPickerModal'; // Importar el nuevo componente

const amenitiesList = [
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'heating', label: 'Calefacción' },
    { id: 'ac', label: 'Aire Acondicionado' },
    { id: 'kitchen', label: 'Cocina' },
    { id: 'washing_machine', label: 'Lavadora' },
    { id: 'balcony', label: 'Balcón' },
    { id: 'pool', label: 'Piscina' },
    { id: 'gym', label: 'Gimnasio' },
] as const;

const PropertyFormSchema = z.object({
    title: z.string().min(10, "El título debe tener al menos 10 caracteres."),
    description: z.string().min(50, "La descripción debe tener al menos 50 caracteres."),
    listingType: z.enum(['rent', 'sale']),
    propertyType: z.enum(['apartment', 'house', 'room']),
    price: z.coerce.number().positive("El precio debe ser un número positivo."),
    area: z.coerce.number().positive("El área debe ser un número positivo."),
    bedrooms: z.coerce.number().int().min(0),
    bathrooms: z.coerce.number().int().min(1),
    address: z.string().min(5, "La dirección es obligatoria."),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
    }),
    images: z.custom<FileList>().optional(),
    amenities: z.array(z.string()).optional(),
});

type PropertyFormValues = z.infer<typeof PropertyFormSchema>;

type PropertyFormProps = {
    propertyToEdit?: Property | null;
    onFormSubmit: () => void;
    isMapsApiLoaded: boolean;
};

export default function PropertyForm({ propertyToEdit, onFormSubmit, isMapsApiLoaded }: PropertyFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isLocationModalOpen, setLocationModalOpen] = useState(false);

    const form = useForm<PropertyFormValues>({
        resolver: zodResolver(PropertyFormSchema),
        defaultValues: propertyToEdit ? {
            ...propertyToEdit,
            images: undefined,
            price: propertyToEdit.price || 0,
        } : {
            title: '',
            description: '',
            listingType: 'rent',
            propertyType: 'apartment',
            price: 0,
            area: 0,
            bedrooms: 1,
            bathrooms: 1,
            address: '',
            location: { lat: 40.416775, lng: -3.703790 }, // Default a Madrid
            images: undefined,
            amenities: [],
        },
    });
    
    const handleLocationSelect = (address: string, location: { lat: number; lng: number; }) => {
        form.setValue('address', address, { shouldValidate: true });
        form.setValue('location', location);
        setLocationModalOpen(false);
    };

    const onSubmit = async (values: PropertyFormValues) => {
        if (!user) return;
        startTransition(async () => {
             try {
                const formData = new FormData();
                
                Object.entries(values).forEach(([key, value]) => {
                    if (key === 'images' && value instanceof FileList) {
                        Array.from(value).forEach(file => formData.append('images', file));
                    } else if (key === 'location') {
                        formData.append(key, JSON.stringify(value));
                    } else if (Array.isArray(value)) {
                        formData.append(key, value.join(','));
                    } else if (value !== undefined && value !== null) {
                        formData.append(key, String(value));
                    }
                });

                const idToken = await user.getIdToken();
                const endpoint = propertyToEdit ? `/api/real-estate/${propertyToEdit.id}` : '/api/real-estate';
                const method = propertyToEdit ? 'PUT' : 'POST';

                const response = await fetch(endpoint, {
                    method: method,
                    headers: { Authorization: `Bearer ${idToken}` },
                    body: formData,
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error?.message || 'Error al guardar la propiedad');
                }

                toast({
                    title: `Propiedad ${propertyToEdit ? 'actualizada' : 'publicada'}`,
                    description: `Tu anuncio ha sido ${propertyToEdit ? 'actualizado' : 'enviado para revisión'}.`,
                });

                onFormSubmit();

            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.' });
            }
        });
    };
    
    const addressValue = form.watch('address');

    return (
         <>
            <ScrollArea className="h-[calc(100vh-150px)] pr-6">
                <div className="py-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título del Anuncio</FormLabel><FormControl><Input placeholder="Ej: Apartamento luminoso en el centro" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            
                            <FormItem>
                                <FormLabel>Dirección</FormLabel>
                                <FormControl>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-grow p-2 border rounded-md min-h-[40px] text-sm bg-muted">
                                            {addressValue ? (
                                                <p>{addressValue}</p>
                                            ) : (
                                                <p className="text-muted-foreground">No se ha seleccionado ninguna dirección</p>
                                            )}
                                        </div>
                                        <Button type="button" variant="outline" onClick={() => setLocationModalOpen(true)}>
                                            <MapPin className="mr-2 h-4 w-4"/>
                                            Seleccionar
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción Detallada</FormLabel><FormControl><Textarea placeholder="Describe tu propiedad: características, vecindario, etc." rows={6} {...field} /></FormControl><FormMessage /></FormItem>)} />

                             <FormField control={form.control} name="images" render={({ field }) => (<FormItem><FormLabel>Fotos de la Propiedad</FormLabel><FormControl><Input type="file" multiple accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormDescription>Puedes seleccionar varias imágenes.</FormDescription><FormMessage /></FormItem>)} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="listingType" render={({ field }) => (<FormItem><FormLabel>Tipo de Anuncio</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="rent">Alquiler</SelectItem><SelectItem value="sale">Venta</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="propertyType" render={({ field }) => (<FormItem><FormLabel>Tipo de Propiedad</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="apartment">Apartamento</SelectItem><SelectItem value="house">Casa</SelectItem><SelectItem value="room">Habitación</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio (€)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="area" render={({ field }) => (<FormItem><FormLabel>Área (m²)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="bedrooms" render={({ field }) => (<FormItem><FormLabel>Habitaciones</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="bathrooms" render={({ field }) => (<FormItem><FormLabel>Baños</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            
                            <FormField
                                control={form.control}
                                name="amenities"
                                render={() => (
                                    <FormItem>
                                        <div className="mb-4">
                                            <FormLabel className="text-base">Servicios y Comodidades</FormLabel>
                                            <FormDescription>Selecciona los servicios que ofrece tu propiedad.</FormDescription>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {amenitiesList.map((item) => (
                                            <FormField
                                                key={item.id}
                                                control={form.control}
                                                name="amenities"
                                                render={({ field }) => {
                                                return (
                                                    <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                ? field.onChange([...(field.value || []), item.id])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                        (value) => value !== item.id
                                                                    )
                                                                    )
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">{item.label}</FormLabel>
                                                    </FormItem>
                                                )
                                                }}
                                            />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </div>
            </ScrollArea>
             <SheetFooter className="pt-4 mt-4 border-t">
                <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (propertyToEdit ? 'Guardar Cambios' : 'Publicar Propiedad')}
                </Button>
            </SheetFooter>

            <LocationPickerModal
                isOpen={isLocationModalOpen}
                onOpenChange={setLocationModalOpen}
                onLocationSelect={handleLocationSelect}
                isMapsApiLoaded={isMapsApiLoaded}
                initialLocation={form.getValues('location')}
            />
        </>
    );
}
