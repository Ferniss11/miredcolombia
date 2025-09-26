
'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, MoreVertical, Loader2, BookOpen, Download } from 'lucide-react';
import Image from 'next/image';
import type { Guide } from '@/lib/guide/domain/guide.entity';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import GuideForm from '@/components/admin/guides/GuideForm';

export default function AdminGuidesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [guides, setGuides] = useState<Guide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
    const [deletingGuideId, setDeletingGuideId] = useState<string | null>(null);

    const fetchGuides = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/guides', { headers: { Authorization: `Bearer ${idToken}` } });
            if (!response.ok) throw new Error("Failed to fetch guides");
            const data = await response.json();
            setGuides(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las guías.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchGuides();
    }, [fetchGuides]);

    const handleOpenSheetForEdit = (guide: Guide) => {
        setEditingGuide(guide);
        setIsSheetOpen(true);
    };

    const handleOpenSheetForCreate = () => {
        setEditingGuide(null);
        setIsSheetOpen(true);
    };

    const handleSheetOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) setEditingGuide(null);
    };

    const handleDelete = async () => {
        if (!deletingGuideId || !user) return;
        startTransition(async () => {
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(`/api/guides/${deletingGuideId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                if (!response.ok) throw new Error((await response.json()).error?.message || 'Error al eliminar');
                toast({ title: 'Guía Eliminada' });
                setDeletingGuideId(null);
                await fetchGuides();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Error inesperado.' });
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Gestión de Guías Descargables</h1>
                <Button onClick={handleOpenSheetForCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Subir Nueva Guía
                </Button>
            </div>

            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                </div>
            ) : guides.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <BookOpen className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No hay guías publicadas</h3>
                    <Button className="mt-4" onClick={handleOpenSheetForCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Crear la primera guía
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {guides.map((guide) => (
                        <Card key={guide.id} className="flex flex-col overflow-hidden">
                            <CardHeader className="p-0 relative">
                                <Image src={guide.coverImageUrl} alt={guide.title} width={400} height={200} className="w-full h-40 object-cover" />
                            </CardHeader>
                            <CardContent className="p-4 flex-grow">
                                <h3 className="font-bold font-headline text-lg leading-snug line-clamp-2">{guide.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{guide.category}</p>
                            </CardContent>
                            <CardFooter className="p-2 border-t mt-auto flex items-center justify-between">
                                <Button variant="ghost" size="sm" asChild>
                                    <a href={guide.pdfUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-2 h-4 w-4" /> PDF
                                    </a>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenSheetForEdit(guide)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDeletingGuideId(guide.id)} disabled={isPending} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            
            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetContent className="sm:max-w-2xl w-full">
                    <SheetHeader>
                        <SheetTitle>{editingGuide ? 'Editar Guía' : 'Subir Nueva Guía'}</SheetTitle>
                        <SheetDescription>Completa los detalles y sube los archivos necesarios.</SheetDescription>
                    </SheetHeader>
                    <GuideForm 
                        guideToEdit={editingGuide}
                        onFormSubmit={() => {
                            handleSheetOpenChange(false);
                            fetchGuides();
                        }}
                    />
                </SheetContent>
            </Sheet>

             <AlertDialog open={!!deletingGuideId} onOpenChange={(open) => !open && setDeletingGuideId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción eliminará la guía y sus archivos asociados.</AlertDialogDescription>
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
