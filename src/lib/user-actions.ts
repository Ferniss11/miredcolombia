
'use server';

import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/admin-config';
import type { BusinessProfile } from './types';
import { revalidatePath } from 'next/cache';

const businessProfileSchema = z.object({
    businessName: z.string().min(2, { message: "El nombre del negocio debe tener al menos 2 caracteres." }),
    address: z.string().min(5, { message: "La dirección es obligatoria." }),
    phone: z.string().min(7, { message: "El número de teléfono es obligatorio." }),
    website: z.string().url({ message: "Debe ser una URL válida." }).or(z.literal("")).optional(),
    description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
});

async function verifyUserAndGetDb(uid: string) {
    if (!uid) {
        throw new Error('Usuario no autenticado');
    }
    if (!adminDb) {
        throw new Error('La base de datos del administrador no está disponible.');
    }
    return adminDb;
}


export async function updateBusinessProfileAction(uid: string, data: BusinessProfile) {
    try {
        const db = await verifyUserAndGetDb(uid);
        const validatedData = businessProfileSchema.parse(data);
        
        const userRef = db.collection("users").doc(uid);
        const updates: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(validatedData)) {
            if (value !== undefined) {
                updates[`businessProfile.${key}`] = value;
            }
        }

        if (Object.keys(updates).length > 0) {
            await userRef.update(updates);
        }
        
        revalidatePath('/dashboard/advertiser/profile');
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


export async function updateBusinessAgentStatusAction(uid: string, isEnabled: boolean) {
    try {
        const db = await verifyUserAndGetDb(uid);
        
        const userRef = db.collection("users").doc(uid);
        await userRef.update({
            'businessProfile.isAgentEnabled': isEnabled
        });
        
        const userDoc = await userRef.get();
        const userProfile = userDoc.data();
        const businessPlaceId = userProfile?.businessProfile?.placeId;

        // Also update the main directory collection so the public page knows
        if (businessPlaceId) {
            const businessRef = db.collection('directory').doc(businessPlaceId);
            await businessRef.update({ isAgentEnabled: isEnabled });
             revalidatePath(`/directory/${businessPlaceId}`);
        }

        revalidatePath('/dashboard/advertiser/profile');
        
        return { success: true };
    } catch (error) {
        console.error('Error updating business agent status:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { error: `No se pudo actualizar el estado del agente: ${errorMessage}` };
    }
}
