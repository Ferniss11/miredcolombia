

// src/app/api/knowledge-base/route.ts
import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { adminDb } from '@/lib/firebase/admin-config';
import { ApiResponse } from '@/lib/platform/api/api-response';

const KNOWLEDGE_BASE_COLLECTION = 'knowledge_base';
const adminRoles = ['Admin', 'SAdmin'];

// Helper type for the aggregation map
type DocumentAggregation = {
  id: string;
  doc_title: string;
  doc_type: string;
  chunk_count: number;
  source: string;
  sessionId?: string;
};


// GET /api/knowledge-base?sessionId=...
// Lists documents in the knowledge base.
// If sessionId is provided, it returns BOTH global 'admin_kb' docs AND docs for that specific session.
// Otherwise, it returns only global 'admin_kb' docs.
export const GET = apiHandler(async (req: NextRequest) => {
    if (!adminDb) {
        return ApiResponse.error('Firestore not initialized', 500);
    }
    
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    
    // Create a map to hold the aggregated results, ensuring no duplicates by doc_id
    const documentsMap = new Map<string, DocumentAggregation>();

    // --- Query 1: Fetch global documents ('admin_kb') ---
    const adminKbQuery = adminDb.collection(KNOWLEDGE_BASE_COLLECTION).where('metadata.source', '==', 'admin_kb');
    const adminKbSnapshot = await adminKbQuery.get();
    
    adminKbSnapshot.forEach(doc => {
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

    // --- Query 2: If a session ID is provided, fetch session-specific documents ---
    if (sessionId) {
        const sessionQuery = adminDb.collection(KNOWLEDGE_BASE_COLLECTION).where('metadata.sessionId', '==', sessionId);
        const sessionSnapshot = await sessionQuery.get();

        sessionSnapshot.forEach(doc => {
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
                        sessionId: metadata.sessionId,
                    });
                }
            }
        });
    }

    // Sort the results alphabetically by title before sending
    const sortedResults = Array.from(documentsMap.values()).sort((a, b) => a.doc_title.localeCompare(b.doc_title));

    return ApiResponse.success(sortedResults);

}, adminRoles);

