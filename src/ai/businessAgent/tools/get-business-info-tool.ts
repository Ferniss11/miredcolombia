
'use server';

/**
 * @fileOverview Defines a Genkit tool for fetching public details of a specific business from Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin-config';

// Schema for the output of the tool, defining what business information is returned.
const BusinessInfoSchema = z.object({
  isFound: z.boolean().describe('Whether the business was found in the database.'),
  name: z.string().optional().describe('The display name of the business.'),
  category: z.string().optional().describe('The category of the business (e.g., Restaurante, Moda).'),
  address: z.string().optional().describe('The physical address of the business.'),
  phone: z.string().optional().describe('The contact phone number for the business.'),
  website: z.string().optional().describe('The business website URL.'),
  description: z.string().optional().describe('A description of the business from their profile.'),
});


export const getBusinessInfoTool = ai.defineTool(
  {
    name: 'getBusinessInfoTool',
    description: 'Fetches public information about a specific business from the database using its ID. This should be the first step for any query related to a business.',
    inputSchema: z.object({
      businessId: z.string().describe("The unique ID (Place ID) of the business to look up."),
    }),
    outputSchema: BusinessInfoSchema,
  },
  async ({ businessId }) => {
    if (!adminDb) {
      console.error("[getBusinessInfoTool] Firestore is not initialized.");
      return { isFound: false };
    }

    try {
      const userSnapshots = await adminDb.collection('users')
        .where('businessProfile.placeId', '==', businessId)
        .limit(1)
        .get();

      if (userSnapshots.empty) {
        return { isFound: false };
      }
      
      const userProfile = userSnapshots.docs[0].data();

      if (!userProfile || !userProfile.businessProfile) {
          return { isFound: false };
      }

      const bizProfile = userProfile.businessProfile;

      return {
        isFound: true,
        name: bizProfile.businessName,
        category: userProfile.category, // This might be on the main directory doc, need to unify
        address: bizProfile.address,
        phone: bizProfile.phone,
        website: bizProfile.website,
        description: bizProfile.description,
      };

    } catch (error) {
      console.error(`[getBusinessInfoTool] Error fetching business info for ${businessId}:`, error);
      // Return a "not found" state to the AI, which is safer than throwing.
      return { isFound: false };
    }
  }
);
