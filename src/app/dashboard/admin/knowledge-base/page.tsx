'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Trash2, MoreVertical, Loader2, Database, BrainCircuit, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

type KnowledgeDocument = {
  id: string;
  doc_title: string;
  source: string;
  doc_type: string;
  chunk_count: number;
};

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  
  const fetchDocuments = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/knowledge-base', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la base de conocimiento.' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('document', file);
        
        const idToken = await user.getIdToken();
        const response = await fetch('/api/knowledge-base/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` },
          body: formData,
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error?.message || 'Error al subir el archivo');
        }
        
        toast({ title: 'Archivo Subido', description: 'El documento se está procesando y se añadirá a la base de conocimiento.' });
        setFile(null);
        // Optimistically add or just refetch
        setTimeout(() => fetchDocuments(), 2000); // Give some time for processing
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Error inesperado.' });
      }
    });
  };

  const handleDelete = async () => {
    if (!deletingDocId || !user) return;
    startTransition(async () => {
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/knowledge-base/${deletingDocId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (!response.ok) throw new Error('Error al eliminar');
            toast({ title: 'Documento Eliminado', description: 'Se han eliminado los fragmentos de la base de conocimiento.' });
            setDocuments(prev => prev.filter(d => d.id !== deletingDocId));
            setDeletingDocId(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el documento.' });
        }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BrainCircuit className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Base de Conocimiento de Valeria</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir Nuevo Conocimiento</CardTitle>
          <CardDescription>
            Sube archivos (PDF, TXT, MD) para añadir información a la memoria a largo plazo de la IA. El contenido será procesado y vectorizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full flex-1">
            <label htmlFor="file-upload" className="sr-only">Seleccionar archivo</label>
            <Input id="file-upload" type="file" onChange={handleFileChange} accept=".pdf,.txt,.md" />
          </div>
          <Button onClick={handleUpload} disabled={isPending || !file}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Subir y Vectorizar
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Documentos Indexados</CardTitle>
          <CardDescription>Esta es la lista de documentos que actualmente forman parte de la base de conocimiento principal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título del Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nº de Fragmentos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : documents.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">La base de conocimiento está vacía.</TableCell></TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/>{doc.doc_title}</TableCell>
                      <TableCell>{doc.doc_type}</TableCell>
                      <TableCell>{doc.chunk_count}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDeletingDocId(doc.id)} disabled={isPending} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar de la Base
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingDocId} onOpenChange={(open) => !open && setDeletingDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todos los fragmentos vectorizados asociados a este documento de la base de conocimiento de la IA. El archivo original en Storage no será eliminado.
            </AlertDialogDescription>
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
