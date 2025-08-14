// src/lib/real-estate/infrastructure/nextjs/property.server-actions.ts
'use server';

import type { Property } from '../../domain/property.entity';
import { GetAllPropertiesUseCase } from '../../application/get-all-properties.use-case';
import { FirestorePropertyRepository } from '../persistence/firestore-property.repository';

// Helper to serialize Date objects to ISO strings for client components
const serializeProperty = (property: Property | null): Property | null => {
    if (!property) return null;

    const serializeDates = (obj: any): any => {
        if (!obj) return obj;
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (obj[key] instanceof Date) {
                newObj[key] = obj[key].toISOString();
            } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                newObj[key] = serializeDates(obj[key]);
            } else {
                newObj[key] = obj[key];
            }
        }
        return newObj;
    }

    return serializeDates(property) as Property;
}

export async function getPublicPropertiesAction(): Promise<{ properties?: Property[], error?: string }> {
    try {
        const repository = new FirestorePropertyRepository();
        const useCase = new GetAllPropertiesUseCase(repository);
        const properties = await useCase.execute('available');
        
        const serializedProperties = properties.map(p => serializeProperty(p)).filter(p => p !== null) as Property[];
        return { properties: serializedProperties };
    } catch (error) {
        console.error("Error fetching published properties:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: errorMessage };
    }
}
