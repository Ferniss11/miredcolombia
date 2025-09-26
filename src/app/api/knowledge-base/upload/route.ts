// src/app/api/knowledge-base/upload/route.ts
import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { adminDb } from '@/lib/firebase/admin-config';
import { ApiResponse } from '@/lib/platform/api/api-response';
import pdf from 'pdf-parse';

const KNOWLEDGE_BASE_COLLECTION = 'knowledge_base';
const adminRoles = ['Admin', 'SAdmin'];

const chunkText = (text: string, chunkSize = 1500, overlap = 200): string[] => {
    const chunks: string[] = [];
    if (!text) return chunks;
    let i = 0;
    while (i < text.length) {
        const end = Math.min(i + chunkSize, text.length);
        chunks.push(text.slice(i, end));
        i += chunkSize - overlap;
    }
    return chunks;
};


// POST /api/knowledge-base/upload
// Handles uploading a document and starting the ingestion process
export const POST = apiHandler(async (req: NextRequest) => {
    if (!adminDb) {
        return ApiResponse.error('Firestore not initialized', 500);
    }
    
    const formData = await req.formData();
    const file = formData.get('document') as File | null;

    if (!file) {
        return ApiResponse.badRequest('No document file provided.');
    }

    let textContent = '';
    const docId = `${Date.now()}-${file.name}`;
    const docTitle = file.name;

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        if (file.type === 'application/pdf') {
            const pdfData = await pdf(buffer);
            textContent = pdfData.text;
        } else {
            textContent = buffer.toString('utf-8');
        }
        
        textContent = textContent.replace(/\s+/g, ' ').trim();

        if (!textContent) {
            return ApiResponse.badRequest('The document appears to be empty or could not be read.');
        }

        const chunks = chunkText(textContent);
        const batch = adminDb.batch();
        const collectionRef = adminDb.collection(KNOWLEDGE_BASE_COLLECTION);
        
        chunks.forEach((chunk, index) => {
            const docRef = collectionRef.doc(); // Auto-generate ID for each chunk
            batch.set(docRef, {
                content: chunk,
                metadata: {
                    source: 'admin_kb',
                    doc_id: docId,
                    doc_title: docTitle,
                    doc_type: file.type,
                    chunk_number: index + 1,
                }
            });
        });

        await batch.commit();

        return ApiResponse.success({ message: `${chunks.length} chunks from document "${docTitle}" have been sent for indexing.` });

    } catch (error) {
        console.error("Error during document upload and chunking:", error);
        return ApiResponse.error('Failed to process the document.');
    }

}, adminRoles);
