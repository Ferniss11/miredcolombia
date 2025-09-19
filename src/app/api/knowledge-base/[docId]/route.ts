// src/app/api/knowledge-base/[docId]/route.ts
import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { adminDb } from '@/lib/firebase/admin-config';
import { ApiResponse } from '@/lib/platform/api/api-response';

const KNOWLEDGE_BASE_COLLECTION = 'knowledge_base';
const adminRoles = ['Admin', 'SAdmin'];

type RouteContext = { params: { docId: string } };

// DELETE /api/knowledge-base/[docId]
// Deletes all chunks associated with a specific document ID
export const DELETE = apiHandler(async (req: NextRequest, { params }: RouteContext) => {
    const { docId } = params;
    if (!adminDb) {
        return ApiResponse.error('Firestore not initialized', 500);
    }

    try {
        const snapshot = await adminDb.collection(KNOWLEDGE_BASE_COLLECTION)
            .where('metadata.doc_id', '==', docId)
            .get();

        if (snapshot.empty) {
            return ApiResponse.notFound(`No knowledge chunks found for document ID: ${docId}`);
        }

        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return ApiResponse.noContent();

    } catch (error) {
        console.error(`Error deleting chunks for docId ${docId}:`, error);
        return ApiResponse.error('Failed to delete document chunks.');
    }

}, adminRoles);
