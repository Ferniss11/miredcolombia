'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Plus, Building, Trash2, AlertCircle, UserCheck, UserX, UserRoundCog } from 'lucide-react';
import { searchBusinessesOnGoogleAction, saveBusinessAction, getSavedBusinessesAction, deleteBusinessAction } from '@/lib/directory-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PlaceDetails } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

type Place = {
    id: string;
    displayName: string;
    formattedAddress: string;
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
    
    // State for Search
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Place[] | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchError, setSearchError] = useState<string | null>(null);

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
            const actionResult = await searchBusinessesOnGoogleAction(query);
            if (actionResult.error) {
                setSearchError(actionResult.error);
                toast({ variant: 'destructive', title: 'Error en la Búsqueda', description: actionResult.error });
            } else if (actionResult.places) {
                setSearchResults(actionResult.places);
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
    
    const getStatusBadge = (biz: PlaceDetails) => {
        if (biz.verificationStatus === 'pending') {
            return <Badge variant="destructive" className="bg-orange-500/80">Pendiente</Badge>
        }
        if (biz.ownerUid && biz.verificationStatus === 'approved') {
            return <Badge className="bg-green-500/80">Verificado</Badge>
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
            
            {searchResults && searchResults.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Resultados de Búsqueda</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {searchResults.map(place => (
                            <Card key={place.id} className="bg-muted/50">
                                <CardContent className="p-3 flex items-center justify-between gap-2">
                                    <div>
                                        <p className="font-bold">{place.displayName}</p>
                                        <p className="text-sm text-muted-foreground">{place.formattedAddress}</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleAddBusiness(place.id)} disabled={isSaving || !selectedCategory}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Añadir
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Directorio Guardado</CardTitle>
                    <CardDescription>Lista de todos los negocios actualmente en el directorio.</CardDescription>
                </CardHeader>
                <CardContent>
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
                                            <Badge variant="outline" className="mt-1">{biz.subscriptionTier}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{biz.formattedAddress}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" disabled={isDeleting}>
                                                <UserRoundCog className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteBusiness(biz.id)} disabled={isDeleting}>
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
                </CardContent>
            </Card>
        </div>
    );
}
