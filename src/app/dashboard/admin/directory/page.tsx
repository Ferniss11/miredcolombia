
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Plus, Building, MapPin, AlertCircle, Code, ListFilter } from 'lucide-react';
import { saveBusinessAction, searchBusinessesOnGoogleAction, getBusinessDetailsAction } from '@/lib/directory-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Place = {
    id: string;
    displayName: string;
    formattedAddress: string;
}

type SearchMode = 'text' | 'placeId';

const categories = [
    "Restaurante", "Moda", "Cafetería", "Servicios Legales", "Supermercado",
    "Agencia de Viajes", "Peluquería", "Servicios Financieros", "Otros"
];

function extractPlaceIdFromUrl(input: string): string {
    // Regular expression to find a Google Place ID (starts with "ChI" and is 27 chars long)
    const placeIdRegex = /(ChI[a-zA-Z0-9_-]{25})/;
    const match = input.match(placeIdRegex);
    
    if (match && match[1]) {
        return match[1]; // Return the extracted Place ID
    }
    
    // If no match, assume the input itself is the Place ID
    return input.trim();
}


export default function AdminDirectoryPage() {
    const { toast } = useToast();
    const [isSearching, startSearchTransition] = useTransition();
    const [isSaving, startSavingTransition] = useTransition();

    const [query, setQuery] = useState('');
    const [searchMode, setSearchMode] = useState<SearchMode>('text');
    const [searchResults, setSearchResults] = useState<Place[] | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchError, setSearchError] = useState<string | null>(null);
    const [rawResponse, setRawResponse] = useState<any>(null); // For debugging

    const handleSearch = () => {
        if (!query) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce una consulta.' });
            return;
        }
        startSearchTransition(async () => {
            setSearchResults(null);
            setSearchError(null);
            setRawResponse(null);
            
            let actionResult;
            if (searchMode === 'text') {
                actionResult = await searchBusinessesOnGoogleAction(query);
            } else {
                const finalPlaceId = extractPlaceIdFromUrl(query);
                actionResult = await getBusinessDetailsAction(finalPlaceId);
            }
            
            setRawResponse(actionResult.rawResponse);

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
                        Busca un negocio en Google y añádelo al directorio público. Puedes buscar por nombre y ciudad, o directamente por su "Place ID" o URL para mayor precisión.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-end gap-2">
                         <div className="grid w-full md:w-[180px] flex-shrink-0 gap-1.5">
                            <Label htmlFor="search-mode">Modo Búsqueda</Label>
                            <Select value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)}>
                                <SelectTrigger id="search-mode">
                                    <SelectValue placeholder="Modo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Por Texto</SelectItem>
                                    <SelectItem value="placeId">Por Place ID o URL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="search-query">
                                {searchMode === 'text' ? 'Nombre y Ciudad del Negocio' : 'Google Place ID o URL de Maps'}
                            </Label>
                            <Input
                                id="search-query"
                                placeholder={searchMode === 'text' ? 'Ej: Arepas El Sabor, Madrid' : 'Ej: ChIJ... o URL de Google Maps'}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="grid w-full md:w-[200px] flex-shrink-0 gap-1.5">
                            <Label htmlFor="category">Categoría a Asignar</Label>
                             <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Selecciona categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching} className="w-full md:w-auto flex-shrink-0">
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
                        <CardTitle className="text-destructive flex items-center gap-2"><AlertCircle />Error en la Búsqueda</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">Ocurrió un error al contactar con la API de Google. Esto puede deberse a que la API aún se está activando o a un problema de configuración.</p>
                        <pre className="mt-4 text-xs whitespace-pre-wrap break-all p-4 bg-black text-white rounded-md overflow-x-auto">
                            {searchError}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {searchResults !== null && !isSearching && !searchError && (
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

            {rawResponse && (
                 <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Code className="h-5 w-5" />
                            Respuesta de la API de Google (Depuración)
                        </CardTitle>
                        <CardDescription>
                            Este es el objeto JSON exacto devuelto por la API de Google Places. Útil para entender por qué una búsqueda podría no funcionar o para ver los datos completos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <pre className="text-xs whitespace-pre-wrap break-all p-4 bg-black text-white rounded-md overflow-x-auto">
                            {JSON.stringify(rawResponse, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
