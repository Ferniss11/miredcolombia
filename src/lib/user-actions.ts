'use server';

import { z } from 'zod';
import { updateBusinessProfile } from '@/services/user.service';
import type { BusinessProfile } from './types';

const businessProfileSchema = z.object({
    businessName: z.string().min(2, { message: "El nombre del negocio debe tener al menos 2 caracteres." }),
    address: z.string().min(5, { message: "La dirección es obligatoria." }),
    phone: z.string().min(7, { message: "El número de teléfono es obligatorio." }),
    website: z.string().url({ message: "Debe ser una URL válida." }).or(z.literal("")).optional(),
    description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
});

export async function updateBusinessProfileAction(uid: string, data: BusinessProfile) {
    try {
        if (!uid) {
            throw new Error('Usuario no autenticado');
        }
        const validatedData = businessProfileSchema.parse(data);
        
        await updateBusinessProfile(uid, validatedData);

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
