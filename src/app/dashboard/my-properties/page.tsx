
'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useJsApiLoader } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, MoreVertical, Loader2, Home as HomeIcon, Check, X, MapPin } from 'lucide-react';
import Image from 'next/image';
import type { Property } from '@/lib/real-estate/domain/property.entity';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PropertyForm from '@/components/inmobiliaria/PropertyForm';

const libraries = ['places', 'maps'] as any;

const PropertyCard = ({ property, onEdit, onDelete, isProcessing }: { property: Property; onEdit: (p: Property) => void; onDelete: (id: string) => void; isProcessing: boolean }) => {
    const getStatusBadge = (status: Property['status']) => {
        switch (status) {
            case 'available': return <Badge className="bg-green-100 text-green-800 border-green-300">Publicado</Badge>;
            case 'pending_review': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
            case 'rejected': return <Badge variant="destructive">Rechazado</Badge>;
            case 'rented': return <Badge variant="secondary">Alquilado</Badge>;
            case 'sold': return <Badge variant="secondary">Vendido</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };
    return (
        <Card className="flex flex-col overflow-hidden">
            {property.images && property.images[0] && <Image src={property.images[0]} alt={property.title} width={400} height={200} className="w-full h-40 object-cover" />}
            <CardHeader className="flex flex-row items-start justify-between p-4">
                <div className="flex-grow">
                    <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2">{property.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3"/>{property.address}</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(property)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(property.id)} disabled={isProcessing} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardFooter className="p-4 pt-0 mt-auto">{getStatusBadge(property.status)}</CardFooter>
        </Card>
    );
};

// New component for Admin view
const AdminPropertyCard = ({ property, onUpdateStatus, onDelete, isProcessing }: { property: Property; onUpdateStatus: (id: string, status: 'available' | 'rejected') => void; onDelete: (id: string) => void; isProcessing: boolean }) => {
    return (
        <Card className="flex flex-col overflow-hidden">
            {property.images && property.images[0] && <Image src={property.images[0]} alt={property.title} width={400} height={200} className="w-full h-40 object-cover" />}
            <CardHeader className="p-4">
                 <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2">{property.title}</h3>
                 <p className="text-xs text-muted-foreground">Propietario: {property.owner.name}</p>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
                <Badge variant="secondary">{property.status === 'pending_review' ? 'Pendiente de Revisión' : property.status}</Badge>
            </CardContent>
            <CardFooter className="p-2 border-t mt-auto flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(property.id)} disabled={isProcessing}><Trash2 className="h-4 w-4"/></Button>
                {property.status === 'pending_review' && (
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onUpdateStatus(property.id, 'rejected')} disabled={isProcessing}>
                            <X className="h-4 w-4" /> Rechazar
                        </Button>
                         <Button size="sm" className="h-8 px-2 bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus(property.id, 'available')} disabled={isProcessing}>
                            <Check className="h-4 w-4" /> Aprobar
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}

export default function MyPropertiesPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
    
    const isAdmin = userProfile?.role === 'Admin' || userProfile?.role === 'SAdmin';

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script-main',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    const fetchProperties = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/real-estate', { headers: { Authorization: `Bearer ${idToken}` } });
            if (!response.ok) throw new Error("Failed to fetch properties");
            const allProperties: Property[] = await response.json();
            
            if (isAdmin) {
                setProperties(allProperties);
            } else {
                setProperties(allProperties.filter(p => p.owner.userId === user.uid));
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar tus propiedades.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, isAdmin, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchProperties();
        }
    }, [authLoading, user, fetchProperties]);

    const handleOpenSheetForEdit = (property: Property) => {
        setEditingProperty(property);
        setIsSheetOpen(true);
    };

    const handleOpenSheetForCreate = () => {
        setEditingProperty(null);
        setIsSheetOpen(true);
    };

    const handleSheetOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) setEditingProperty(null);
    };

    const handleDelete = async () => {
        if (!deletingPropertyId || !user) return;
        startTransition(async () => {
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(`/api/real-estate/${deletingPropertyId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${idToken}` } });
                if (!response.ok) throw new Error((await response.json()).error?.message || 'Error al eliminar');
                toast({ title: 'Propiedad Eliminada' });
                setDeletingPropertyId(null);
                await fetchProperties();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Error inesperado.' });
            }
        });
    };
    
     const handleUpdateStatus = async (propertyId: string, status: 'available' | 'rejected') => {
        if (!user) return;
        startTransition(async () => {
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(`/api/real-estate/${propertyId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                    body: JSON.stringify({ status }),
                });
                if (!response.ok) throw new Error((await response.json()).error?.message || 'Error al actualizar estado');
                toast({ title: 'Estado Actualizado', description: `La propiedad ha sido ${status === 'available' ? 'aprobada' : 'rechazada'}.` });
                await fetchProperties();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Error inesperado.' });
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">{isAdmin ? 'Moderar Propiedades' : 'Mis Propiedades'}</h1>
                <Button onClick={handleOpenSheetForCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Publicar Propiedad
                </Button>
            </div>
            
            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                </div>
            ) : properties.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <HomeIcon className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">Aún no hay propiedades</h3>
                    <Button className="mt-4" onClick={handleOpenSheetForCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Publicar mi primera propiedad
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {properties.map(property => {
                        if (isAdmin && property.owner.userId !== user?.uid) {
                             return <AdminPropertyCard 
                                key={property.id}
                                property={property}
                                onUpdateStatus={handleUpdateStatus}
                                onDelete={() => setDeletingPropertyId(property.id)}
                                isProcessing={isPending}
                             />;
                        }
                        return <PropertyCard
                            key={property.id}
                            property={property}
                            onEdit={handleOpenSheetForEdit}
                            onDelete={() => setDeletingPropertyId(property.id)}
                            isProcessing={isPending}
                        />
                    })}
                </div>
            )}
            
            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetContent className="sm:max-w-2xl w-full">
                    <SheetHeader>
                        <SheetTitle>{editingProperty ? 'Editar Propiedad' : 'Publicar Nueva Propiedad'}</SheetTitle>
                        <SheetDescription>Completa los detalles de tu inmueble para que aparezca en el portal.</SheetDescription>
                    </SheetHeader>
                    {isLoaded ? (
                         <PropertyForm 
                            propertyToEdit={editingProperty}
                            onFormSubmit={() => {
                                handleSheetOpenChange(false);
                                fetchProperties();
                            }}
                            isMapsApiLoaded={isLoaded}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin"/></div>
                    )}
                </SheetContent>
            </Sheet>

             <AlertDialog open={!!deletingPropertyId} onOpenChange={(open) => !open && setDeletingPropertyId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción eliminará permanentemente el anuncio de la propiedad.</AlertDialogDescription>
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
