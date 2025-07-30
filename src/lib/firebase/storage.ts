'use server';

import { z } from 'zod';
import { adminDb, adminAuth, adminInstance, adminStorage } from '@/lib/firebase/admin-config';
import type { BusinessProfile, BusinessAgentConfig, BusinessAnalytics, CandidateProfile, CandidateProfileFormValues, UserProfile } from './types';
import { revalidatePath } from 'next/cache';
import { BusinessAgentConfigSchema, CandidateProfileSchema } from './types';
import { getPlatformConfig } from '@/services/platform.service';
import { getUserProfileByUid } from '@/services/admin.service';

const FieldValue = adminInstance?.firestore.FieldValue;

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

        revalidatePath('/dashboard/advertiser/agent');
        
        return { success: true };
    } catch (error) {
        console.error('Error updating business agent status:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { error: `No se pudo actualizar el estado del agente: ${errorMessage}` };
    }
}


export async function updateBusinessAgentConfigAction(uid: string, config: BusinessAgentConfig) {
    try {
        const db = await verifyUserAndGetDb(uid);
        const validatedConfig = BusinessAgentConfigSchema.parse(config);

        const userRef = db.collection('users').doc(uid);
        await userRef.update({
            'businessProfile.agentConfig': validatedConfig
        });

        revalidatePath('/dashboard/advertiser/agent');
        return { success: true };
    } catch (error) {
        console.error('Error updating business agent config:', error);
        const errorMessage = error instanceof z.ZodError 
            ? error.errors.map(e => e.message).join(', ')
            : error instanceof Error ? error.message : 'Unknown error';
        return { error: `No se pudo guardar la configuración del agente: ${errorMessage}` };
    }
}


export async function getBusinessAnalyticsAction(uid: string): Promise<BusinessAnalytics> {
    const defaultAnalytics = {
        totalFinalCost: 0,
        totalConversations: 0,
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        profitMargin: 0,
    };
    
    try {
        const db = await verifyUserAndGetDb(uid);
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) throw new Error("User not found");

        const placeId = userDoc.data()?.businessProfile?.placeId;
        if (!placeId) return defaultAnalytics;

        const chatSessionsSnapshot = await db.collection('directory').doc(placeId).collection('businessChatSessions').get();

        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalRealCost = 0;

        chatSessionsSnapshot.forEach(doc => {
            const data = doc.data();
            const messages = data.messages || []; // Assuming messages are stored in an array on the session now
            messages.forEach((msg: any) => {
                if (msg.usage) {
                    totalInputTokens += msg.usage.inputTokens || 0;
                    totalOutputTokens += msg.usage.outputTokens || 0;
                }
                totalRealCost += msg.cost || 0;
            });
        });
        
        // Fetch platform profit margin
        const platformConfig = await getPlatformConfig();
        const profitMargin = platformConfig.profitMarginPercentage;
        
        const totalFinalCost = totalRealCost + (totalRealCost * (profitMargin / 100));

        return {
            totalFinalCost,
            totalConversations: chatSessionsSnapshot.size,
            totalTokens: totalInputTokens + totalOutputTokens,
            totalInputTokens,
            totalOutputTokens,
            profitMargin,
        };

    } catch (error) {
        console.error("Error getting business analytics:", error);
        return defaultAnalytics;
    }
}


export async function updateCandidateProfileAction(
  uid: string,
  formData: FormData,
) {
  try {
    const db = await verifyUserAndGetDb(uid);
    if (!adminStorage) {
      throw new Error("Firebase Admin Storage is not initialized.");
    }

    const userRef = db.collection("users").doc(uid);
    
    const professionalTitle = formData.get('professionalTitle') as string || '';
    const summary = formData.get('summary') as string || '';
    const skills = (formData.get('skills') as string || '').split(',').map(s => s.trim()).filter(Boolean);
    const resumeFile = formData.get('resumeFile') as File | null;

    // Get existing profile data to merge with
    const userDoc = await userRef.get();
    const existingProfile = (userDoc.data() as UserProfile)?.candidateProfile || {};

    let resumeUrl = existingProfile.resumeUrl; // Start with existing URL

    // Upload file if a new one is provided
    if (resumeFile && resumeFile.size > 0) {
      const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      if (!BUCKET_NAME) {
          throw new Error("Firebase Storage bucket name is not configured.");
      }
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const filePath = `resumes/${uid}/${Date.now()}-${resumeFile.name}`;
      
      const bucket = adminStorage.bucket(BUCKET_NAME);
      const file = bucket.file(filePath);
      
      await file.save(buffer, {
        metadata: {
          contentType: resumeFile.type,
          cacheControl: 'public, max-age=31536000',
        },
      });
      
      const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '01-01-2100',
      });
      resumeUrl = url;
    }
    
    if (!resumeUrl) {
      throw new Error("El currículum es obligatorio y no se pudo procesar.");
    }

    // Construct the complete new profile object
    const newProfile: CandidateProfile = {
      ...existingProfile,
      professionalTitle,
      summary,
      skills,
      resumeUrl,
    };

    // Perform a single update operation with the complete object
    await userRef.update({
      candidateProfile: newProfile
    });
    
    revalidatePath('/dashboard/candidate-profile');
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar el perfil del candidato:', error);
    const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return { success: false, error: errorMessage };
  }
}