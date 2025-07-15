
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Plus, Building, MapPin, AlertCircle } from 'lucide-react';
import { saveBusinessAction, searchBusinessesOnGoogleAction } from '@/lib/directory-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    const [isSearching, startSearchTransition] = useTransition();
    const [isSaving, startSavingTransition] = useTransition();

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Place[] | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchError, setSearchError] = useState<string | null>(null);

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
        startSavingTransition(async () => {
            const result = await saveBusinessAction(placeId, selectedCategory);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Error al Guardar', description: result.error });
            } else {
                toast({ title: 'Éxito', description: result.message });
                setSearchResults(prev => prev ? prev.filter(p => p.id !== placeId) : null);
            }
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="w-6 h-6"/>Añadir Negocio al Directorio (Gratuito)</CardTitle>
                    <CardDescription>
                        Busca un negocio en Google y añádelo al directorio público de Mi Red Colombia.
                        Esto crea perfiles gratuitos gestionados por el administrador.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-end gap-2">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="search-query">Nombre y Ciudad del Negocio</Label>
                            <Input
                                id="search-query"
                                placeholder="Ej: Arepas El Sabor, Madrid"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="grid w-full md:w-auto gap-1.5">
                            <Label htmlFor="category">Categoría</Label>
                             <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger id="category" className="w-full md:w-[200px]">
                                    <SelectValue placeholder="Selecciona categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching} className="w-full md:w-auto">
                            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Buscar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isSearching && (
                <div className="text-center p-8 space-y-4">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Buscando en Google Places...</p>
                </div>
            )}

            {searchError && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Error en la Búsqueda
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Ocurrió un error al contactar con la API de Google Places. Detalles:</p>
                        <pre className="text-sm bg-muted p-4 rounded-md mt-2 font-mono">{searchError}</pre>
                    </CardContent>
                </Card>
            )}

            {searchResults !== null && !isSearching && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados de la Búsqueda</CardTitle>
                         <CardDescription>
                            {searchResults.length > 0
                                ? `Se encontraron ${searchResults.length} resultados. Selecciona una categoría y añade los negocios al directorio.`
                                : "No se encontraron resultados para tu búsqueda. Intenta con otros términos."}
                        </CardDescription>
                    </CardHeader>
                    {searchResults.length > 0 && (
                        <CardContent className="space-y-4">
                            {searchResults.map(place => (
                                <Card key={place.id} className="bg-muted/50">
                                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <h4 className="font-bold">{place.displayName}</h4>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                <MapPin className="h-4 w-4"/>
                                                {place.formattedAddress}
                                            </p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            className="w-full sm:w-auto flex-shrink-0"
                                            onClick={() => handleAddBusiness(place.id)}
                                            disabled={isSaving || !selectedCategory}
                                        >
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                            Añadir
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    )}
                </Card>
            )}
        </div>
    );
}
