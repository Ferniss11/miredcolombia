
'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, MoreVertical, Loader2, Handshake, Check, X } from 'lucide-react';
import Image from 'next/image';
import { ServiceListing } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';


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

const formatPriceType = (priceType: 'per_hour' | 'fixed' | 'per_project') => {
    switch (priceType) {
        case 'per_hour': return '/ hora';
        case 'fixed': return 'fijo';
        case 'per_project': return '/ proyecto';
        default: return '';
    }
};

export default function MyServicesPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [listings, setListings] = useState<ServiceListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<ServiceListing | null>(null);
    const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

    const form = useForm<ServiceListingFormValues>({
        resolver: zodResolver(ServiceListingFormSchema),
        defaultValues: {
            title: '',
            description: '',
            category: '',
            city: '',
            price: 0,
            priceType: 'fixed',
            contactPhone: '',
            contactEmail: '',
            contactViaWhatsApp: false,
        },
    });

    const fetchListings = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/services', {
                headers: { Authorization: `Bearer ${idToken}` }
            });
            if (!response.ok) throw new Error("Failed to fetch listings");
            
            const allListings = await response.json();
            
            if (userProfile?.role === 'Admin' || userProfile?.role === 'SAdmin') {
                setListings(allListings);
            } else {
                setListings(allListings.filter((l: ServiceListing) => l.userId === user.uid));
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar tus servicios.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, userProfile, toast]);

    useEffect(() => {
        if (!authLoading) {
            fetchListings();
        }
    }, [authLoading, fetchListings]);

    useEffect(() => {
        if (editingListing) {
            form.reset({
                ...editingListing,
                price: editingListing.price || 0,
                contactViaWhatsApp: editingListing.contactViaWhatsApp || false,
            });
        } else {
            form.reset({
                title: '', description: '', category: '', city: '',
                price: 0, priceType: 'fixed', contactPhone: userProfile?.businessProfile?.phone || '',
                contactEmail: userProfile?.email || '',
                contactViaWhatsApp: true,
            });
        }
    }, [editingListing, form, userProfile]);

    const handleOpenSheetForEdit = (listing: ServiceListing) => {
        setEditingListing(listing);
        setIsSheetOpen(true);
    };

    const handleOpenSheetForCreate = () => {
        setEditingListing(null);
        setIsSheetOpen(true);
    };

    const handleSheetOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) setEditingListing(null);
    };
    
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
                const endpoint = editingListing ? `/api/services/${editingListing.id}` : '/api/services';
                
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
                    title: `Servicio ${editingListing ? 'actualizado' : 'creado'}`,
                    description: `Tu servicio ha sido ${editingListing ? 'actualizado' : 'enviado para revisión'}.`,
                });
                
                handleSheetOpenChange(false);
                await fetchListings();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.' });
            }
        });
    };

    const handleDelete = async () => {
        if (!deletingListingId || !user) return;
        startTransition(async () => {
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(`/api/services/${deletingListingId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                if (!response.ok) {
                     const result = await response.json();
                    throw new Error(result.error?.message || 'Error al eliminar el servicio');
                }
                toast({ title: 'Servicio Eliminado', description: 'Tu oferta de servicio ha sido eliminada.' });
                setDeletingListingId(null);
                await fetchListings();
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.' });
            }
        });
    };
    
    const handleUpdateStatus = (listingId: string, status: 'published' | 'rejected') => {
        startTransition(async () => {
             if (!user) return;
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(`/api/services/${listingId}/status`, {
                    method: 'PUT',
                    headers: { 
                        Authorization: `Bearer ${idToken}`,
                        'Content-Type': 'application/json',
                     },
                    body: JSON.stringify({ status }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error?.message || 'Error al actualizar estado');
                }
                toast({ title: 'Estado Actualizado', description: `El servicio ha sido ${status === 'published' ? 'aprobado' : 'rechazado'}.` });
                await fetchListings();
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.' });
            }
        });
    }
    
     const getStatusBadge = (status: ServiceListing['status']) => {
        switch (status) {
            case 'published': return <Badge className="bg-green-100 text-green-800 border-green-300">Publicado</Badge>;
            case 'pending_review': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
            case 'rejected': return <Badge variant="destructive">Rechazado</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const isAdmin = userProfile?.role === 'Admin' || userProfile?.role === 'SAdmin';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">{isAdmin ? 'Moderar Servicios' : 'Mis Servicios Ofrecidos'}</h1>
                <Button onClick={handleOpenSheetForCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Servicio
                </Button>
            </div>
            
            {isLoading ? (
                 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                 </div>
            ) : listings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Handshake className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">Aún no has publicado ningún servicio</h3>
                    <p className="mt-1 text-sm">Crea tu primera oferta para que aparezca aquí.</p>
                    <Button className="mt-4" onClick={handleOpenSheetForCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Ofrecer mi primer servicio
                    </Button>
                </div>
            ) : (
                 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                     {listings.map(listing => (
                        <Card key={listing.id} className="flex flex-col overflow-hidden">
                             {listing.imageUrl && <Image src={listing.imageUrl} alt={listing.title} width={400} height={200} className="w-full h-40 object-cover" />}
                             <CardHeader className="flex flex-row items-start justify-between p-4">
                                <div className="flex-grow">
                                    <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2">{listing.title}</h3>
                                    <p className="text-xs text-muted-foreground">{listing.category}</p>
                                </div>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenSheetForEdit(listing)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDeletingListingId(listing.id)} disabled={isPending} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </CardHeader>
                             <CardContent className="p-4 pt-0 text-sm text-muted-foreground flex-grow">
                                {listing.city} - <span className="font-bold text-foreground">€{listing.price}</span> <span className="text-xs">{formatPriceType(listing.priceType)}</span>
                             </CardContent>
                             <CardFooter className="p-2 border-t mt-auto flex items-center justify-between">
                                {getStatusBadge(listing.status)}
                                {isAdmin && listing.status === 'pending_review' && (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleUpdateStatus(listing.id, 'rejected')} disabled={isPending}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                         <Button size="sm" className="h-8 px-2 bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(listing.id, 'published')} disabled={isPending}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                             </CardFooter>
                        </Card>
                     ))}
                 </div>
            )}
            
            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetContent className="sm:max-w-2xl w-full">
                    <SheetHeader>
                        <SheetTitle>{editingListing ? 'Editar Servicio' : 'Crear Nuevo Servicio'}</SheetTitle>
                        <SheetDescription>Completa los detalles para que la comunidad pueda encontrar tus servicios.</SheetDescription>
                    </SheetHeader>
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
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingListing ? 'Guardar Cambios' : 'Crear Servicio')}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!deletingListingId} onOpenChange={(open) => !open && setDeletingListingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer y eliminará permanentemente tu oferta de servicio.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                           {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
