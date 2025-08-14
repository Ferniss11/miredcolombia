
'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, MoreVertical, Loader2, Handshake, Check, X, Tag } from 'lucide-react';
import Image from 'next/image';
import type { ServiceListing } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ServiceForm from '@/components/services/ServiceForm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

    const fetchListings = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/services', {
                headers: { Authorization: `Bearer ${idToken}` }
            });
            if (!response.ok) throw new Error("Failed to fetch listings");
            
            const allListings: ServiceListing[] = await response.json();
            
            // Admins see all posts, users only see their own.
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
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
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
                        <Collapsible key={listing.id} asChild>
                             <Card className="flex flex-col overflow-hidden">
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
                                     <div className="flex items-center gap-2 mb-2">
                                        <Tag className="h-4 w-4 flex-shrink-0" />
                                        <span className="font-semibold text-foreground">€{listing.price}</span>
                                        <span className="text-xs">{formatPriceType(listing.priceType)}</span>
                                     </div>
                                     <p className="line-clamp-3">{listing.description}</p>
                                      {listing.description.length > 100 && (
                                        <CollapsibleTrigger asChild>
                                            <Button variant="link" className="p-0 h-auto text-xs">Ver más</Button>
                                        </CollapsibleTrigger>
                                      )}
                                      <CollapsibleContent>
                                        <p className="mt-2 text-sm">{listing.description}</p>
                                      </CollapsibleContent>
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
                        </Collapsible>
                     ))}
                 </div>
            )}
            
            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                 <SheetContent className="sm:max-w-2xl w-full">
                     <SheetHeader>
                         <SheetTitle>{editingListing ? 'Editar Servicio' : 'Crear Nuevo Servicio'}</SheetTitle>
                         <SheetDescription>Completa los detalles para que la comunidad pueda encontrar tus servicios.</SheetDescription>
                     </SheetHeader>
                     <ServiceForm 
                        listingToEdit={editingListing} 
                        onFormSubmit={async () => {
                            handleSheetOpenChange(false);
                            await fetchListings();
                        }}
                     />
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
