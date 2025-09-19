// src/app/api/knowledge-base/route.ts
import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { adminDb } from '@/lib/firebase/admin-config';
import { ApiResponse } from '@/lib/platform/api/api-response';

const KNOWLEDGE_BASE_COLLECTION = 'knowledge_base';
const adminRoles = ['Admin', 'SAdmin'];

// GET /api/knowledge-base
// Lists all unique documents in the knowledge base
export const GET = apiHandler(async (req: NextRequest) => {
    if (!adminDb) {
        return ApiResponse.error('Firestore not initialized', 500);
    }
    
    const snapshot = await adminDb.collection(KNOWLEDGE_BASE_COLLECTION)
        .where('metadata.source', '==', 'admin_kb')
        .get();

    if (snapshot.empty) {
        return ApiResponse.success([]);
    }

    const documentsMap = new Map<string, { id: string; doc_title: string; doc_type: string; chunk_count: number; source: string }>();

    snapshot.forEach(doc => {
        const metadata = doc.data().metadata;
        if (metadata && metadata.doc_id && metadata.doc_title) {
            if (documentsMap.has(metadata.doc_id)) {
                const existing = documentsMap.get(metadata.doc_id)!;
                existing.chunk_count += 1;
            } else {
                documentsMap.set(metadata.doc_id, {
                    id: metadata.doc_id,
                    doc_title: metadata.doc_title,
                    doc_type: metadata.doc_type || 'Desconocido',
                    chunk_count: 1,
                    source: metadata.source,
                });
            }
        }
    });

    return ApiResponse.success(Array.from(documentsMap.values()));
}, adminRoles);
