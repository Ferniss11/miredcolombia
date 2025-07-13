
'use server';

import { z } from 'zod';
import { doc, updateDoc } from "firebase/firestore";
import { db as clientDb } from "@/lib/firebase/config";
import type { BusinessProfile } from './types';

const businessProfileSchema = z.object({
    businessName: z.string().min(2, { message: "El nombre del negocio debe tener al menos 2 caracteres." }),
    address: z.string().min(5, { message: "La dirección es obligatoria." }),
    phone: z.string().min(7, { message: "El número de teléfono es obligatorio." }),
    website: z.string().url({ message: "Debe ser una URL válida." }).or(z.literal("")).optional(),
    description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
});

export async function updateBusinessProfileAction(uid: string, data: BusinessProfile) {
    if (!clientDb) {
      return { error: 'Firebase client database is not initialized.' };
    }
    try {
        if (!uid) {
            throw new Error('Usuario no autenticado');
        }
        const validatedData = businessProfileSchema.parse(data);
        
        const userRef = doc(clientDb, "users", uid);
        const updates: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(validatedData)) {
            if (value !== undefined) {
                updates[`businessProfile.${key}`] = value;
            }
        }

        if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
        }

        return { success: true };
    } catch (error) {
        console.error('Error al actualizar el perfil del negocio:', error);
        if (error instanceof z.ZodError) {
            return { error: error.errors.map(e => e.message).join(', ') };
        }
         if (error instanceof Error) {
            const friendlyMessage = "No se pudo guardar el perfil. " +
                "Revisa los permisos de la base de datos. " +
                `Error original: ${error.message}`;
            return { error: friendlyMessage };
        }
        return { error: 'No se pudo actualizar el perfil. Por favor, inténtalo de nuevo.' };
    }
}
