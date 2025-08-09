
'use client';

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Plus, Building, Trash2, AlertCircle, UserCheck, UserX, CheckCircle, ChevronDown, Copy, MoreVertical, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PlaceDetails } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { getSavedBusinessesAction, updateBusinessStatusAction } from '@/lib/directory-actions';
import { googlePlacesSearch } from '@/ai/tools/google-places-search';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
    
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Place[] | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchError, setSearchError] = useState<string | null>(null);
    const [rawApiResponse, setRawApiResponse] = useState<any>(null);

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
        if (!query) return;
        startSearchTransition(async () => {
            setSearchResults(null);
            setSearchError(null);
            setRawApiResponse(null);
            const result = await googlePlacesSearch({ query });
            setRawApiResponse(result.rawResponse || { error: "No raw response" });
            if ('error' in result) {
                setSearchError(String(result.error));
            } else {
                setSearchResults(result.places as Place[]);
            }
        });
    };

    const handleAddBusiness = (placeId: string) => {
        if (!selectedCategory) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona una categoría para el negocio.' });
            return;
        }
        if (!user) return;
        startSavingTransition(async () => {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ placeId, category: selectedCategory }),
            });
            const result = await response.json();
            if (!response.ok) {
                toast({ variant: 'destructive', title: 'Error al Guardar', description: result.error.message });
            } else {
                toast({ title: 'Éxito', description: "Negocio añadido al directorio." });
                setSearchResults(prev => prev ? prev.filter(p => p.id !== placeId) : null);
                fetchSavedBusinesses();
            }
        });
    };

    const handleDeleteBusiness = (placeId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este negocio del directorio?')) return;
        if (!user) return;
        startDeletingTransition(async () => {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/directory/${placeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${idToken}` },
            });
            if (!response.ok) {
                const result = await response.json();
                toast({ variant: 'destructive', title: 'Error al Eliminar', description: result.error.message });
            } else {
                toast({ title: 'Éxito', description: 'El negocio ha sido eliminado.' });
                fetchSavedBusinesses();
            }
        });
    };
    
    const handleStatusUpdate = (placeId: string, newStatus: 'approved' | 'unclaimed') => {
        startUpdatingStatusTransition(async () => {
            const result = await updateBusinessStatusAction(placeId, newStatus);
            if (!result.success) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Éxito', description: `El estado del negocio ha sido actualizado.` });
                fetchSavedBusinesses();
            }
        });
    };

    const handleCopyRawResponse = () => {
        navigator.clipboard.writeText(JSON.stringify(rawApiResponse, null, 2));
        toast({ title: 'Copiado', description: 'La respuesta de la API ha sido copiada.' });
    };

    const getStatusBadge = (biz: PlaceDetails) => {
        if (biz.verificationStatus === 'approved') {
            return <Badge className="bg-green-500/80 hover:bg-green-500/90">Publicado</Badge>;
        }
        if (biz.verificationStatus === 'pending') {
            return <Badge variant="destructive" className="bg-orange-500/80 hover:bg-orange-500/90">Pendiente de Verificación</Badge>;
        }
        return <Badge variant="secondary">No Publicado</Badge>;
    };

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
                                    <TableHead>Propietario</TableHead>
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
                                            <TableCell><Badge variant="outline">{biz.category}</Badge></TableCell>
                                            <TableCell>{getStatusBadge(biz)}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{biz.ownerUid || 'No reclamado'}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {biz.verificationStatus === 'pending' && biz.ownerUid && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    className="text-green-600 focus:text-green-700"
                                                                    onClick={() => handleStatusUpdate(biz.id!, 'approved')}
                                                                    disabled={isUpdatingStatus}
                                                                >
                                                                    <UserCheck className="mr-2 h-4 w-4" /> Aprobar Reclamación
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-orange-600 focus:text-orange-700"
                                                                    onClick={() => handleStatusUpdate(biz.id!, 'unclaimed')}
                                                                    disabled={isUpdatingStatus}
                                                                >
                                                                    <UserX className="mr-2 h-4 w-4" /> Rechazar Reclamación
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                         {biz.verificationStatus !== 'approved' && biz.verificationStatus !== 'pending' && (
                                                            <DropdownMenuItem
                                                                className="text-green-600 focus:text-green-700"
                                                                onClick={() => handleStatusUpdate(biz.id!, 'approved')}
                                                                disabled={isUpdatingStatus}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" /> Publicar
                                                            </DropdownMenuItem>
                                                        )}
                                                        {biz.verificationStatus === 'approved' && (
                                                            <DropdownMenuItem
                                                                className="text-orange-600 focus:text-orange-700"
                                                                onClick={() => handleStatusUpdate(biz.id!, 'unclaimed')}
                                                                disabled={isUpdatingStatus}
                                                            >
                                                                <EyeOff className="mr-2 h-4 w-4" /> Revocar Publicación
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-700"
                                                            onClick={() => handleDeleteBusiness(biz.id!)}
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
