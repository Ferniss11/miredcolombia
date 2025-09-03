// src/app/dashboard/admin/email-sequences/page.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, MoreVertical, Loader2, Mails, ToggleRight, ToggleLeft, Sparkles, AlertTriangle } from 'lucide-react';
import type { EmailSequence } from '@/lib/email-sequence/domain/email-sequence.entity';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import SequenceForm from './SequenceForm';
import { generateEmailSequence } from '@/ai/flows/generate-email-sequence.flow';
import type { GenerateEmailSequenceInput, GenerateEmailSequenceOutput } from '@/lib/types';
import GenerateSequenceModal from './GenerateSequenceModal';

const DRAFT_STORAGE_KEY = 'aiGeneratedSequenceDraft';

export default function AdminEmailSequencesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [sequences, setSequences] = useState<EmailSequence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingSequence, setEditingSequence] = useState<EmailSequence | GenerateEmailSequenceOutput | null>(null);
    const [deletingSequenceId, setDeletingSequenceId] = useState<string | null>(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    
    // State for handling the localStorage draft
    const [draft, setDraft] = useState<GenerateEmailSequenceOutput | null>(null);
    const [isDraftAlertOpen, setDraftAlertOpen] = useState(false);


    const fetchSequences = React.useCallback(() => {
        if (!user) return;
        setIsLoading(true);
        user.getIdToken().then(token => {
            fetch('/api/email/sequences', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch')))
                .then(data => setSequences(data))
                .catch(() => toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las secuencias.' }))
                .finally(() => setIsLoading(false));
        });
    }, [user, toast]);

    useEffect(() => {
        fetchSequences();
        // Check for a draft in localStorage when the component mounts
        try {
            const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (savedDraft) {
                setDraft(JSON.parse(savedDraft));
                setDraftAlertOpen(true);
            }
        } catch (error) {
            console.error("Failed to read draft from localStorage", error);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        }

    }, [fetchSequences]);

    const handleOpenSheetForCreate = () => {
        setEditingSequence(null);
        setIsSheetOpen(true);
    };

    const handleOpenSheetForEdit = (sequence: EmailSequence) => {
        setEditingSequence(sequence);
        setIsSheetOpen(true);
    };

    const handleSheetClose = () => {
        setIsSheetOpen(false);
        setEditingSequence(null);
    };
    
    const handleFormSuccess = () => {
        handleSheetClose();
        localStorage.removeItem(DRAFT_STORAGE_KEY); // Clear draft on successful save
        fetchSequences();
    };

    const handleDelete = async () => {
        if (!deletingSequenceId || !user) return;
        startTransition(async () => {
            try {
                const token = await user.getIdToken();
                const response = await fetch(`/api/email/sequences/${deletingSequenceId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                if (!response.ok) throw new Error('Error al eliminar');
                toast({ title: 'Secuencia Eliminada' });
                setSequences(prev => prev.filter(s => s.id !== deletingSequenceId));
                setDeletingSequenceId(null);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la secuencia.' });
            }
        });
    };
    
    const handleToggleStatus = async (sequence: EmailSequence) => {
        if (!user) return;
        startTransition(async () => {
             try {
                const token = await user.getIdToken();
                const response = await fetch(`/api/email/sequences/${sequence.id}`, { 
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: !sequence.isActive }),
                });
                if (!response.ok) throw new Error('Error al cambiar el estado');
                toast({ title: 'Estado Actualizado' });
                setSequences(prev => prev.map(s => s.id === sequence.id ? { ...s, isActive: !s.isActive } : s));
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cambiar el estado.' });
            }
        });
    };
    
    const handleAiGenerationSubmit = (input: GenerateEmailSequenceInput) => {
        startTransition(async () => {
            try {
                setIsGenerateModalOpen(false);
                toast({ title: "Generando secuencia...", description: "La IA está trabajando en tu nueva secuencia de emails. Esto puede tardar un momento." });
                
                const generatedSequence = await generateEmailSequence(input);

                if (generatedSequence) {
                    // Save to localStorage before opening the sheet
                    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(generatedSequence));
                    setEditingSequence(generatedSequence);
                    setIsSheetOpen(true);
                } else {
                    throw new Error("La IA no devolvió una secuencia válida.");
                }
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error de IA', description: error instanceof Error ? error.message : 'No se pudo generar la secuencia.' });
            }
        });
    };

    const handleRestoreDraft = () => {
        if (draft) {
            setEditingSequence(draft);
            setIsSheetOpen(true);
            setDraftAlertOpen(false);
        }
    }
    
    const handleDiscardDraft = () => {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraft(null);
        setDraftAlertOpen(false);
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Mails className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">Secuencias de Email</h1>
                 </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={() => setIsGenerateModalOpen(true)} disabled={isPending}>
                        <Sparkles className="mr-2 h-4 w-4" /> Crear con IA
                    </Button>
                    <Button onClick={handleOpenSheetForCreate} variant="outline">
                        <Plus className="mr-2 h-4 w-4" /> Crear Nueva
                    </Button>
                 </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Automatizaciones Activas</CardTitle>
                    <CardDescription>Gestiona las secuencias de correos que se envían a los usuarios tras eventos específicos.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Disparador (Trigger)</TableHead>
                                    <TableHead>Pasos</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                    ))
                                ) : sequences.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24">No hay secuencias creadas.</TableCell></TableRow>
                                ) : (
                                    sequences.map((sequence) => (
                                        <TableRow key={sequence.id}>
                                            <TableCell className="font-medium">{sequence.name}</TableCell>
                                            <TableCell><Badge variant="secondary">{sequence.trigger}</Badge></TableCell>
                                            <TableCell>{sequence.steps.length}</TableCell>
                                            <TableCell>
                                                <Badge className={sequence.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                    {sequence.isActive ? 'Activa' : 'Inactiva'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleOpenSheetForEdit(sequence)}><Edit className="mr-2 h-4 w-4" /> Editar Pasos</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(sequence)} disabled={isPending}>
                                                          {sequence.isActive ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
                                                          {sequence.isActive ? 'Desactivar' : 'Activar'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setDeletingSequenceId(sequence.id)} disabled={isPending} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
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

            <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
                <SheetContent className="sm:max-w-4xl w-full p-0 flex flex-col">
                    <SheetHeader className="p-6 pb-0">
                        <SheetTitle>{editingSequence && 'id' in editingSequence ? 'Editar Secuencia' : 'Crear Nueva Secuencia'}</SheetTitle>
                        <SheetDescription>
                            Define los pasos, el contenido y los tiempos de tu automatización.
                        </SheetDescription>
                    </SheetHeader>
                    <SequenceForm 
                        sequenceToEdit={editingSequence as EmailSequence | null}
                        onSuccess={handleFormSuccess}
                        onCancel={handleSheetClose}
                    />
                </SheetContent>
            </Sheet>

            <GenerateSequenceModal
                isOpen={isGenerateModalOpen}
                onOpenChange={setIsGenerateModalOpen}
                onSubmit={handleAiGenerationSubmit}
                isGenerating={isPending}
            />

            <AlertDialog open={!!deletingSequenceId} onOpenChange={(open) => !open && setDeletingSequenceId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción eliminará la secuencia y no se podrá recuperar. Los correos ya programados podrían no cancelarse.</AlertDialogDescription>
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
            
            {/* Draft recovery dialog */}
             <AlertDialog open={isDraftAlertOpen} onOpenChange={setDraftAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-yellow-500" />Borrador sin Guardar</AlertDialogTitle>
                        <AlertDialogDescription>Detectamos una secuencia generada por IA que no fue guardada. ¿Quieres continuar editándola?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction variant="destructive" onClick={handleDiscardDraft}>Descartar</AlertDialogAction>
                        <AlertDialogAction onClick={handleRestoreDraft}>Sí, restaurar borrador</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
