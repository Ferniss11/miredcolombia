
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { debugUnsplashSearchAction, debugAdminInitAction } from '@/lib/ai-actions';
import { Loader2, Search, Bug, Server } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type UnsplashResult = {
  imageUrl: string;
  imageHint: string;
} | null;

export default function AdminDebugPage() {
  const { toast } = useToast();
  const [isSearching, startSearchTransition] = useTransition();
  const [isCheckingAdmin, startAdminCheckTransition] = useTransition();

  const [query, setQuery] = useState('colombian food');
  const [unsplashResult, setUnsplashResult] = useState<UnsplashResult>(null);
  const [unsplashError, setUnsplashError] = useState<string | null>(null);

  const [adminStatus, setAdminStatus] = useState<string | null>(null);

  const handleSearch = () => {
    if (!query) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce una consulta.' });
      return;
    }

    startSearchTransition(async () => {
      setUnsplashResult(null);
      setUnsplashError(null);
      const actionResult = await debugUnsplashSearchAction(query);
      if (actionResult.error) {
        setUnsplashError(actionResult.error);
        toast({ variant: 'destructive', title: 'Error en la Búsqueda', description: actionResult.error });
      } else if (actionResult.result) {
        setUnsplashResult(actionResult.result as UnsplashResult);
        toast({ title: 'Búsqueda Exitosa', description: `Se encontró una imagen para "${query}".` });
      }
    });
  };
  
  const handleAdminCheck = () => {
    startAdminCheckTransition(async () => {
        setAdminStatus(null);
        const result = await debugAdminInitAction();
        setAdminStatus(result.status);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Bug className="w-8 h-8 text-destructive" />
        <h1 className="text-3xl font-bold font-headline">Depuración de Herramientas IA</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5"/>Verificar Firebase Admin SDK</CardTitle>
          <CardDescription>
            Haz clic en el botón para comprobar si el SDK de Firebase Admin se está inicializando correctamente en el entorno del servidor. Esto es crucial para guardar datos, como las publicaciones del blog.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleAdminCheck} disabled={isCheckingAdmin}>
                {isCheckingAdmin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Server className="mr-2 h-4 w-4" />}
                Verificar Estado del Admin SDK
            </Button>
            {isCheckingAdmin && (
                 <p className="text-sm text-muted-foreground mt-4">Comprobando estado en el servidor...</p>
            )}
            {adminStatus && (
                <Alert className="mt-4" variant={adminStatus.startsWith('Initialized') || adminStatus.startsWith('Re-accessed') ? 'default' : 'destructive'}>
                    <AlertTitle>{adminStatus.startsWith('Initialized') || adminStatus.startsWith('Re-accessed') ? 'Éxito' : 'Error'}</AlertTitle>
                    <AlertDescription>
                        <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                            {adminStatus}
                        </pre>
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Probar Herramienta: Unsplash Search</CardTitle>
          <CardDescription>
            Introduce una consulta para llamar directamente a la herramienta `unsplashSearch` y ver la respuesta en bruto.
            Esto ayuda a verificar si la API de Unsplash y la clave de entorno están funcionando correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="search-query">Consulta de Búsqueda</Label>
              <Input
                id="search-query"
                placeholder="Ej: madrid cityscape, legal documents"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="self-end">
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {isSearching && (
        <div className="text-center p-8 space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Buscando en Unsplash...</p>
        </div>
      )}

      {unsplashError && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-md">{unsplashError}</pre>
          </CardContent>
        </Card>
      )}

      {unsplashResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Búsqueda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Vista Previa de la Imagen</h3>
              <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                <Image
                  src={unsplashResult.imageUrl}
                  alt={`Resultado para: ${unsplashResult.imageHint}`}
                  fill
                  className="object-cover"
                  unoptimized // Desactivamos la optimización de Next para probar la URL directa
                />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Respuesta JSON de la Herramienta</h3>
              <pre className="text-xs whitespace-pre-wrap break-all p-4 bg-black text-white rounded-md overflow-x-auto">
                {JSON.stringify(unsplashResult, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
