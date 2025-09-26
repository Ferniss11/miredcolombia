// src/app/dashboard/admin/email-sequences/GenerateSequenceModal.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { GenerateEmailSequenceInputSchema, type GenerateEmailSequenceInput } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GenerateSequenceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GenerateEmailSequenceInput) => void;
  isGenerating: boolean;
}

const formSchema = GenerateEmailSequenceInputSchema;

export default function GenerateSequenceModal({ isOpen, onOpenChange, onSubmit, isGenerating }: GenerateSequenceModalProps) {
  
  const form = useForm<GenerateEmailSequenceInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objective: 'Secuencia de bienvenida para usuarios que descargan la guía de empadronamiento.',
      numSteps: 3,
      tone: 'Amigable',
      additionalInfo: 'En el último email, mencionar sutilmente nuestros planes de consultoría.',
      model: 'googleai/gemini-1.5-pro-latest',
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar Secuencia con IA</DialogTitle>
          <DialogDescription>
            Dale a Valeria el contexto que necesita para crear una secuencia de emails efectiva y personalizada para ti.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="objective" render={({ field }) => (
                <FormItem>
                    <FormLabel>Objetivo Principal de la Secuencia</FormLabel>
                    <FormControl><Textarea placeholder="Ej: Dar la bienvenida y aportar valor a nuevos suscriptores..." rows={3} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="numSteps" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nº de Emails</FormLabel>
                        <FormControl><Input type="number" min="1" max="7" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="tone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tono</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Amigable">Amigable</SelectItem>
                                <SelectItem value="Formal">Formal</SelectItem>
                                <SelectItem value="Persuasivo">Persuasivo</SelectItem>
                                <SelectItem value="Informativo">Informativo</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
             <FormField control={form.control} name="additionalInfo" render={({ field }) => (
                <FormItem>
                    <FormLabel>Información Adicional (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="Ej: Mencionar un descuento del 10% en el último email..." rows={2} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                    <FormLabel>Modelo de IA</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un modelo" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash (Rápido)</SelectItem>
                            <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro (Potente)</SelectItem>
                            <SelectItem value="googleai/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                            <SelectItem value="googleai/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                            <SelectItem value="googleai/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generar Secuencia
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
