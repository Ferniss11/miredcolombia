
'use client';

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Plus, Building, Trash2, AlertCircle, UserCheck, UserX, UserRoundCog, CheckCircle, ChevronDown, Copy } from 'lucide-react';
import { searchBusinessesOnGoogleAction, saveBusinessAction, getSavedBusinessesAction, deleteBusinessAction, updateBusinessVerificationStatusAction, publishBusinessAction } from '@/lib/directory-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PlaceDetails } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type Place = {
    id: string;
    displayName: string;
    formattedAddress: string;
    photoUrl?: string;
}

const categories = [
    "Restaurante", "Moda", "Cafetería", "Servicios Legales", "Supermercado",
    "Agencia de Viajes", "Peluquería", "Servicios Financieros", "Otros"
];

export default function AdminDirectoryPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSearching, startSearchTransition] = useTransition();
    const [isSaving, startSavingTransition] = useTransition();
    const [isDeleting, startDeletingTransition] = useTransition();
    const [isUpdatingStatus, startUpdatingStatusTransition] = useTransition();
    
    // State for Search
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Place[] | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchError, setSearchError] = useState<string | null>(null);
    const [rawApiResponse, setRawApiResponse] = useState<any>(null);


    // State for Saved Businesses
    const [savedBusinesses, setSavedBusinesses] = useState<PlaceDetails[]>([]);
    const [isLoadingSaved, setIsLoadingSaved] = useState(true);

    const fetchSavedBusinesses = async () => {
        setIsLoadingSaved(true);
        const result = await getSavedBusinessesAction();
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error al Cargar', description: result.error });
        } else if (result.businesses) {
            setSavedBusinesses(result.businesses);
        }
        setIsLoadingSaved(false);
    };

    useEffect(() => {
        fetchSavedBusinesses();
    }, []);

    const handleSearch = () => {
        if (!query) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce una consulta.' });
            return;
        }
        startSearchTransition(async () => {
            setSearchResults(null);
            setSearchError(null);
            setRawApiResponse(null);

            const actionResult = await searchBusinessesOnGoogleAction(query);
            
            setRawApiResponse(actionResult.rawResponse || { error: actionResult.error });

            if (actionResult.error) {
                setSearchError(actionResult.error);
                toast({ variant: 'destructive', title: 'Error en la Búsqueda', description: actionResult.error });
            } else if (actionResult.places) {
                setSearchResults(actionResult.places as Place[]);
            }
        });
    };

    const handleAddBusiness = (placeId: string) => {
        if (!selectedCategory) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona una categoría para el negocio.' });
            return;
        }
        if (!user) {
             toast({ variant: 'destructive', title: 'Error', description: 'Debes estar autenticado para realizar esta acción.' });
            return;
        }
        startSavingTransition(async () => {
            const result = await saveBusinessAction(placeId, selectedCategory, user.uid);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al Guardar', description: result.error });
            } else {
                toast({ title: 'Éxito', description: result.message });
                setSearchResults(prev => prev ? prev.filter(p => p.id !== placeId) : null);
                fetchSavedBusinesses(); // Refresh the list of saved businesses
            }
        });
    };

    const handleDeleteBusiness = (placeId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este negocio del directorio?')) {
            return;
        }
        startDeletingTransition(async () => {
            const result = await deleteBusinessAction(placeId);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al Eliminar', description: result.error });
            } else {
                toast({ title: 'Éxito', description: 'El negocio ha sido eliminado.' });
                fetchSavedBusinesses(); // Refresh the list
            }
        });
    };

    const handleVerificationUpdate = (placeId: string, ownerUid: string, status: 'approved' | 'rejected') => {
        startUpdatingStatusTransition(async () => {
            const result = await updateBusinessVerificationStatusAction(placeId, ownerUid, status);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Éxito', description: `El estado del negocio ha sido actualizado a ${status === 'approved' ? 'Aprobado' : 'Rechazado'}.` });
                fetchSavedBusinesses();
            }
        });
    }
    
    const handlePublishBusiness = (placeId: string) => {
        startUpdatingStatusTransition(async () => {
            const result = await publishBusinessAction(placeId);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Éxito', description: `El negocio ha sido publicado.` });
                fetchSavedBusinesses();
            }
        });
    }

    const handleCopyRawResponse = () => {
        navigator.clipboard.writeText(JSON.stringify(rawApiResponse, null, 2));
        toast({ title: 'Copiado', description: 'La respuesta de la API ha sido copiada.' });
    };
    
    const getStatusBadge = (biz: PlaceDetails) => {
        if (biz.verificationStatus === 'pending') {
            return <Badge variant="destructive" className="bg-orange-500/80">Pendiente</Badge>
        }
        if (biz.verificationStatus === 'approved') {
            return <Badge className="bg-green-500/80">Publicado</Badge>
        }
        return <Badge variant="secondary">No Reclamado</Badge>
    }


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="w-6 h-6"/>Añadir Negocio al Directorio</CardTitle>
                    <CardDescription>Busca un negocio en Google por su nombre y ciudad para añadirlo.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex flex-col md:flex-row items-end gap-2">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="search-query">Búsqueda por Texto (ej: Restaurante La Rochela, Madrid)</Label>
                            <Input id="search-query" placeholder='Restaurante colombiano en...' value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                        </div>
                        <div className="grid w-full md:w-[200px] flex-shrink-0 gap-1.5">
                            <Label htmlFor="category">Categoría a Asignar</Label>
                             <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger id="category"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching} className="w-full md:w-auto flex-shrink-0">
                            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Buscar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isSearching && <div className="text-center p-4"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>}
            
            {searchError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error en Búsqueda</AlertTitle><AlertDescription>{searchError}</AlertDescription></Alert>}
            
             {searchResults && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados de Búsqueda ({searchResults.length})</CardTitle>
                        <CardDescription>Estos son los negocios encontrados en Google. Añade los que correspondan al directorio.</CardDescription>
                    </CardHeader>
                    <CardContent className={cn("grid gap-4", searchResults.length > 0 && "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
                        {searchResults.length > 0 ? searchResults.map(place => (
                           <Card key={place.id} className="flex flex-col overflow-hidden">
                                <CardHeader className="p-0 relative h-40">
                                     <Image
                                        src={place.photoUrl || "https://placehold.co/400x250.png"}
                                        alt={place.displayName}
                                        fill
                                        data-ai-hint="business exterior"
                                        className="object-cover"
                                    />
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2">
                                        {place.displayName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{place.formattedAddress}</p>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button size="sm" className="w-full" onClick={() => handleAddBusiness(place.id)} disabled={isSaving || !selectedCategory}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Añadir
                                    </Button>
                                </CardFooter>
                            </Card>
                        )) : (
                            <p className="text-muted-foreground text-center col-span-full py-8">No se encontraron resultados para tu búsqueda.</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {rawApiResponse && (
                <Collapsible>
                    <Card>
                        <CollapsibleTrigger asChild>
                            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50">
                                <div>
                                    <CardTitle>Respuesta de la API de Google (Depuración)</CardTitle>
                                    <CardDescription className="mt-1">
                                        Haz clic aquí para mostrar u ocultar el objeto JSON devuelto por la API de Google.
                                    </CardDescription>
                                </div>
                                <ChevronDown className="h-5 w-5 transition-transform [&[data-state=open]]:rotate-180" />
                            </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                             <CardContent className="relative">
                                 <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-7 w-7" onClick={handleCopyRawResponse}>
                                     <Copy className="h-4 w-4" />
                                 </Button>
                                 <pre className="text-xs whitespace-pre-wrap break-all p-4 bg-black/80 text-white rounded-md overflow-x-auto">
                                    {JSON.stringify(rawApiResponse, null, 2)}
                                </pre>
                             </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Directorio Guardado</CardTitle>
                    <CardDescription>Lista de todos los negocios actualmente en el directorio.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre del Negocio</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Dirección</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingSaved ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : savedBusinesses.length > 0 ? (
                                    savedBusinesses.map(biz => (
                                        <TableRow key={biz.id}>
                                            <TableCell className="font-medium">{biz.displayName}</TableCell>
                                            <TableCell><Badge variant="secondary">{biz.category}</Badge></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(biz)}
                                                </div>
                                                {biz.subscriptionTier && <Badge variant="outline" className="mt-1">{biz.subscriptionTier}</Badge>}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{biz.formattedAddress}</TableCell>
                                            <TableCell className="text-right space-x-1">
                                                {biz.verificationStatus === 'pending' && biz.ownerUid && (
                                                    <>
                                                        <Button variant="ghost" size="icon" className='text-green-600 hover:text-green-700' onClick={() => handleVerificationUpdate(biz.id!, biz.ownerUid!, 'approved')} disabled={isUpdatingStatus}>
                                                            <UserCheck className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className='text-red-600 hover:text-red-700' onClick={() => handleVerificationUpdate(biz.id!, biz.ownerUid!, 'rejected')} disabled={isUpdatingStatus}>
                                                            <UserX className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {biz.verificationStatus === 'unclaimed' && (
                                                    <Button variant="outline" size="sm" onClick={() => handlePublishBusiness(biz.id!)} disabled={isUpdatingStatus}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600"/> Publicar
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" disabled={isDeleting}>
                                                    <UserRoundCog className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteBusiness(biz.id!)} disabled={isDeleting}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No hay negocios en el directorio todavía.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
