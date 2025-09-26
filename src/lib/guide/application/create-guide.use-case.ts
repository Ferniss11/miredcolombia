// src/lib/guide/application/create-guide.use-case.ts
import type { Guide } from '../domain/guide.entity';
import type { GuideRepository } from '../domain/guide.repository';
import { adminDb } from '@/lib/firebase/admin-config';
import pdf from 'pdf-parse';
import { getStorage } from 'firebase-admin/storage';

const KNOWLEDGE_BASE_COLLECTION = 'knowledge_base';

// Helper function to split text into chunks
const chunkText = (text: string, chunkSize = 1500, overlap = 200): string[] => {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
};


export type CreateGuideInput = Omit<Guide, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Use case for creating a new guide.
 * Now also handles indexing the guide's content into the vector knowledge base.
 */
export class CreateGuideUseCase {
  constructor(private readonly repository: GuideRepository) {}
  
  private async indexGuideContent(guide: Guide): Promise<void> {
    if (!adminDb) {
      console.warn('[CreateGuideUseCase] Firestore not initialized, skipping indexing.');
      return;
    }

    try {
        console.log(`[Indexer] Starting indexing for guide: ${guide.title}`);
        
        // 1. Download the PDF from Firebase Storage
        const bucket = getStorage().bucket();
        // Extract the file path from the full gs:// or https:// URL
        const filePath = new URL(guide.pdfUrl).pathname.split('/').slice(2).join('/');
        const file = bucket.file(filePath);
        const [pdfBuffer] = await file.download();

        // 2. Parse the PDF content
        const pdfData = await pdf(pdfBuffer);
        const textContent = pdfData.text.replace(/\s+/g, ' ').trim(); // Normalize whitespace

        if (!textContent) {
            console.warn(`[Indexer] PDF for guide "${guide.title}" has no text content. Skipping.`);
            return;
        }

        // 3. Split content into chunks
        const chunks = chunkText(textContent);
        console.log(`[Indexer] Split content into ${chunks.length} chunks.`);

        // 4. Write each chunk to the knowledge_base collection
        const batch = adminDb.batch();
        const collectionRef = adminDb.collection(KNOWLEDGE_BASE_COLLECTION);
        
        chunks.forEach((chunk, index) => {
            const docRef = collectionRef.doc(); // Auto-generate ID
            const chunkData = {
                content: chunk,
                metadata: {
                    source: 'admin_kb', // This identifies it as part of the core knowledge base
                    doc_id: guide.id,
                    doc_title: guide.title,
                    chunk_number: index + 1,
                }
            };
            batch.set(docRef, chunkData);
        });

        await batch.commit();
        console.log(`[Indexer] Successfully indexed ${chunks.length} chunks for guide "${guide.title}".`);

    } catch (error) {
        console.error(`[Indexer] Failed to index content for guide ${guide.id}:`, error);
        // We don't re-throw the error, as creating the guide is the primary goal.
        // We can add more robust error reporting here (e.g., to a logging service).
    }
  }


  async execute(input: CreateGuideInput): Promise<Guide> {
    const now = new Date();
    const guideToCreate: Omit<Guide, 'id'> = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    
    // Step 1: Create the primary guide document in the 'guides' collection
    const newGuide = await this.repository.create(guideToCreate);

    // Step 2: Asynchronously trigger the indexing of its content into the vector DB.
    // We don't await this because we don't want to block the UI.
    // It's a background process.
    this.indexGuideContent(newGuide);

    return newGuide;
  }
}
