
'use client';

import React, { useEffect, useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SheetFooter, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Upload } from 'lucide-react';
import type { Guide } from '@/lib/guide/domain/guide.entity';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/lib/firebase/config'; // Import client-side Firebase app

// Initialize Firebase Storage
const storage = getStorage(app);


// Zod Schema for the form
const GuideFormSchema = z.object({
  title: z.string().min(5, "El título es muy corto."),
  description: z.string().min(10, "La descripción es muy corta."),
  category: z.string().min(1, "Debes seleccionar una categoría."),
  coverImageFile: z.custom<FileList>().optional(),
  pdfFile: z.custom<FileList>().optional(),
});

type GuideFormValues = z.infer<typeof GuideFormSchema>;

type GuideFormProps = {
  guideToEdit?: Guide | null;
  onFormSubmit: () => void;
};

// --- Helper function to upload a file from the client ---
async function uploadClientFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}


export default function GuideForm({ guideToEdit, onFormSubmit }: GuideFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<GuideFormValues>({
    resolver: zodResolver(GuideFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      coverImageFile: undefined,
      pdfFile: undefined,
    },
  });

  useEffect(() => {
    if (guideToEdit) {
      form.reset({
        title: guideToEdit.title,
        description: guideToEdit.description,
        category: guideToEdit.category,
      });
    } else {
      form.reset();
    }
  }, [guideToEdit, form]);

  const onSubmit = async (values: GuideFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.' });
        return;
    }
    
    const coverImageFile = values.coverImageFile?.[0];
    const pdfFile = values.pdfFile?.[0];

    if (!guideToEdit && !coverImageFile) {
        form.setError('coverImageFile', { message: 'La imagen de portada es obligatoria.' });
        return;
    }
    if (!guideToEdit && !pdfFile) {
        form.setError('pdfFile', { message: 'El archivo PDF es obligatorio.' });
        return;
    }

    startTransition(async () => {
      try {
        let coverImageUrl: string | undefined = guideToEdit?.coverImageUrl;
        let pdfUrl: string | undefined = guideToEdit?.pdfUrl;

        // 1. Upload files from client-side if they exist
        if (coverImageFile) {
            const path = `guides/${user.uid}/${Date.now()}-${coverImageFile.name}`;
            coverImageUrl = await uploadClientFile(coverImageFile, path);
        }
        if (pdfFile) {
             const path = `guides/${user.uid}/${Date.now()}-${pdfFile.name}`;
            pdfUrl = await uploadClientFile(pdfFile, path);
        }

        // 2. Prepare data for the API call (only URLs, no files)
        const apiData = {
            title: values.title,
            description: values.description,
            category: values.category,
            coverImageUrl,
            pdfUrl,
        };

        const idToken = await user.getIdToken();
        const endpoint = guideToEdit ? `/api/guides/${guideToEdit.id}` : '/api/guides';
        
        // 3. Call the API with JSON data
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}` 
          },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error?.message || 'Error al guardar la guía');
        }

        toast({
          title: `Guía ${guideToEdit ? 'actualizada' : 'creada'}`,
          description: 'La guía se ha guardado correctamente.',
        });
        onFormSubmit();

      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Error inesperado.' });
      }
    });
  };

  return (
    <ScrollArea className="h-[calc(100vh-150px)] pr-6">
      <div className="py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título de la Guía</FormLabel><FormControl><Input placeholder="Ej: Guía completa para el empadronamiento" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción Corta</FormLabel><FormControl><Textarea placeholder="Un resumen de lo que el usuario encontrará en la guía." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Elige una categoría" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Trámites">Trámites</SelectItem><SelectItem value="Vivienda">Vivienda</SelectItem><SelectItem value="Trabajo">Trabajo</SelectItem><SelectItem value="Cultura">Cultura</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            
            <FormField control={form.control} name="coverImageFile" render={({ field }) => (
                <FormItem>
                    <FormLabel>Imagen de Portada</FormLabel>
                    <FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl>
                    <FormDescription>{guideToEdit ? "Sube un archivo para reemplazar la portada actual." : "Sube la imagen de portada para la guía."}</FormDescription>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="pdfFile" render={({ field }) => (
                <FormItem>
                    <FormLabel>Archivo PDF de la Guía</FormLabel>
                    <FormControl><Input type="file" accept="application/pdf" onChange={(e) => field.onChange(e.target.files)} /></FormControl>
                     <FormDescription>{guideToEdit ? "Sube un archivo para reemplazar el PDF actual." : "Sube el archivo PDF de la guía."}</FormDescription>
                    <FormMessage />
                </FormItem>
            )} />

            <SheetFooter className="pt-4 sticky bottom-0 bg-background">
                <SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose>
                <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {guideToEdit ? 'Guardar Cambios' : 'Subir Guía'}
                </Button>
            </SheetFooter>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}
