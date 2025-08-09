
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Copy } from 'lucide-react';
import Link from 'next/link';

export default function ErrorDisplayPage() {
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Leer el error del sessionStorage al cargar la página
    const storedError = sessionStorage.getItem('fullError');
    if (storedError) {
      setError(storedError);
      // Opcional: limpiar el error después de mostrarlo
      // sessionStorage.removeItem('fullError');
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(error);
    toast({
      title: 'Copiado',
      description: 'El mensaje de error ha sido copiado al portapapeles.',
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <Card className="max-w-4xl mx-auto border-destructive">
        <CardHeader>
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle>Error de Servidor Detectado</CardTitle>
              <CardDescription>
                A continuación se muestra el mensaje de error completo para depuración.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Este error suele ocurrir en Firestore cuando falta un índice compuesto. Busca una URL que empiece por `https://console.firebase.google.com/project/...` en el texto de abajo, cópiala y pégala en tu navegador para crear el índice necesario.
          </p>
          <div className="relative bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <pre className="whitespace-pre-wrap break-all">
              {error || 'No se encontró ningún error en la sesión...'}
            </pre>
          </div>
          <div className="mt-6 flex justify-end">
             <Button asChild>
                <Link href="/">Volver al Inicio</Link>
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
