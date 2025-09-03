// src/app/dashboard/admin/email-sequences/SequenceForm.tsx
'use client';

import React, { useTransition, useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetFooter } from '@/components/ui/sheet';
import { Loader2, PlusCircle, Trash2, Maximize, Minimize } from 'lucide-react';
import { TiptapEditor } from '@/components/ui/tiptap-editor';
import { EmailSequence, EmailStep } from '@/lib/email-sequence/domain/email-sequence.entity';
import { v4 as uuidv4 } from 'uuid';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const SequenceStepSchema = z.object({
  id: z.string().default(() => uuidv4()),
  delayMinutes: z.coerce.number().min(0, "El retraso no puede ser negativo."),
  subject: z.string().min(3, "El asunto es muy corto."),
  body: z.string().min(10, "El cuerpo del email es muy corto."),
});

const SequenceFormSchema = z.object({
  name: z.string().min(3, "El nombre de la secuencia es muy corto."),
  trigger: z.enum(['on_guide_download', 'on_user_signup', 'on_service_purchase']),
  steps: z.array(SequenceStepSchema),
});

type SequenceFormValues = z.infer<typeof SequenceFormSchema>;

interface SequenceFormProps {
  sequenceToEdit?: EmailSequence | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const EmailStepForm = ({ control, index, remove }: { control: any, index: number, remove: (index: number) => void }) => {
    const [isEditorExpanded, setIsEditorExpanded] = useState(false);
    return (
        <Card className="relative bg-muted/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">Paso {index + 1}</CardTitle>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={control} name={`steps.${index}.delayMinutes`} render={({ field }) => (<FormItem><FormLabel>Retraso desde el paso anterior (en minutos)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name={`steps.${index}.subject`} render={({ field }) => (<FormItem><FormLabel>Asunto del Email</FormLabel><FormControl><Input placeholder="Asunto del correo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                
                <Collapsible open={isEditorExpanded} onOpenChange={setIsEditorExpanded}>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FormLabel>Cuerpo del Email</FormLabel>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    {isEditorExpanded ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
                                    {isEditorExpanded ? 'Contraer' : 'Expandir'}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                             <FormField control={control} name={`steps.${index}.body`} render={({ field }) => (<FormItem><FormControl><TiptapEditor value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            </CardContent>
        </Card>
    )
}

export default function SequenceForm({ sequenceToEdit, onSuccess, onCancel }: SequenceFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SequenceFormValues>({
    resolver: zodResolver(SequenceFormSchema),
    defaultValues: { name: '', trigger: 'on_guide_download', steps: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'steps',
  });

  useEffect(() => {
    if (sequenceToEdit) {
      form.reset({
        name: sequenceToEdit.name,
        trigger: sequenceToEdit.trigger,
        steps: sequenceToEdit.steps.map(s => ({...s})), // Create a copy
      });
    } else {
        form.reset({ name: '', trigger: 'on_guide_download', steps: [{ id: uuidv4(), delayMinutes: 60, subject: '', body: '<p>Hola {{firstName}},</p>' }] });
    }
  }, [sequenceToEdit, form]);
  
  const addStep = () => {
    append({ id: uuidv4(), delayMinutes: 60, subject: '', body: '<p>Hola {{firstName}},</p>' });
  };
  
  const onSubmit = async (values: SequenceFormValues) => {
    if (!user) return;
    startTransition(async () => {
        try {
            const token = await user.getIdToken();
            const endpoint = sequenceToEdit ? `/api/email/sequences/${sequenceToEdit.id}` : '/api/email/sequences';
            const method = sequenceToEdit ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error?.message || 'Error al guardar la secuencia');
            }
            toast({ title: `Secuencia ${sequenceToEdit ? 'actualizada' : 'creada'}` });
            onSuccess();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Error desconocido' });
        }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <ScrollArea className="flex-grow p-1 -ml-1">
          <div className="space-y-6 py-6 pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre de la Secuencia</FormLabel><FormControl><Input placeholder="Ej: Bienvenida Guía Empadronamiento" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="trigger" render={({ field }) => (<FormItem><FormLabel>Disparador (Trigger)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="on_guide_download">Al descargar una guía</SelectItem><SelectItem value="on_user_signup" disabled>Al registrarse un usuario</SelectItem><SelectItem value="on_service_purchase" disabled>Al comprar un servicio</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Pasos de la Secuencia</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <EmailStepForm key={field.id} control={form.control} index={index} remove={remove} />
                ))}
                <Button type="button" variant="outline" onClick={addStep} className="w-full">
                  <PlusCircle className="w-4 h-4 mr-2" /> Añadir Paso (Email)
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="py-4 pr-6 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {sequenceToEdit ? 'Guardar Cambios' : 'Crear Secuencia'}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

