// src/app/api/indexing/start/route.ts
import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { apiHandler } from '@/lib/platform/api/api-handler';

import { GetAllGuidesUseCase } from '@/lib/guide/application/get-all-guides.use-case';
import { FirestoreGuideRepository } from '@/lib/guide/infrastructure/persistence/firestore-guide.repository';
import { GetAllBlogPostsUseCase } from '@/lib/blog/application/get-all-blog-posts.use-case';
import { FirestoreBlogPostRepository } from '@/lib/blog/infrastructure/persistence/firestore-blog.repository';
import { adminDb } from '@/lib/firebase/admin-config';
import pdf from 'pdf-parse';
import { getStorage } from 'firebase-admin/storage';
import { BlogPost } from '@/lib/blog/domain/blog-post.entity';
import { Guide } from '@/lib/guide/domain/guide.entity';

const KNOWLEDGE_BASE_COLLECTION = 'knowledge_base';

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


async function indexContent(documents: (Guide | BlogPost)[]) {
    if (!adminDb) {
      throw new Error('Firestore not initialized');
    }
    const bucket = getStorage().bucket();
    const collectionRef = adminDb.collection(KNOWLEDGE_BASE_COLLECTION);
    
    let processedCount = 0;

    for (const doc of documents) {
        const batch = adminDb.batch(); // Create a new batch for each document to avoid size limits
        let textContent = '';
        const isGuide = 'pdfUrl' in doc;

        try {
            if (isGuide && doc.pdfUrl) {
                const filePath = new URL(doc.pdfUrl).pathname.split('/').slice(2).join('/');
                const file = bucket.file(filePath);
                const [pdfBuffer] = await file.download();
                const pdfData = await pdf(pdfBuffer);
                textContent = pdfData.text;
            } else if (!isGuide && 'content' in doc && doc.content) { // Handle simple blog posts
                 textContent = `# ${doc.title}\n\n${doc.content}`;
            } else if (!isGuide && 'sections' in doc && doc.sections) { // Handle intelligent blog posts
                const sectionsText = doc.sections.map(s => `## ${s.heading}\n${s.content}`).join('\n\n');
                textContent = `# ${doc.title}\n\n**Introducción:**\n${doc.introduction}\n\n${sectionsText}\n\n**Conclusión:**\n${doc.conclusion}`;
            }
        } catch (e) {
            console.error(`Failed to process document content for ${doc.id} ("${doc.title}"):`, e);
            continue; // Skip this document if content processing fails
        }
        
        textContent = textContent.replace(/\s+/g, ' ').trim();
        if (!textContent) continue;

        const chunks = chunkText(textContent);

        chunks.forEach((chunk, index) => {
            // By writing to the 'content' field, we trigger the `firebase/firestore-vector-search`
            // extension to automatically generate the embedding and write it to the 'embedding' field.
            const chunkDocRef = collectionRef.doc();
            batch.set(chunkDocRef, {
                content: chunk,
                metadata: {
                    source: 'admin_kb',
                    doc_id: doc.id,
                    doc_title: doc.title,
                    doc_type: isGuide ? 'guide' : 'blog',
                    chunk_number: index + 1,
                }
            });
        });
        
        if (chunks.length > 0) {
            await batch.commit();
            processedCount++;
        }
    }
    
    return processedCount;
}


async function startIndexingProcess(req: NextRequest) {
    try {
        const guideRepo = new FirestoreGuideRepository();
        const getAllGuides = new GetAllGuidesUseCase(guideRepo);
        const guides = await getAllGuides.execute();
        
        const blogRepo = new FirestoreBlogPostRepository();
        const getAllPosts = new GetAllBlogPostsUseCase(blogRepo);
        // We want to index all posts, not just published ones
        const posts = await getAllPosts.execute(false);

        const indexedGuides = await indexContent(guides);
        const indexedPosts = await indexContent(posts);
        
        return ApiResponse.success({
            message: 'Indexing process completed.',
            indexedGuides,
            indexedPosts
        });

    } catch (error) {
        console.error("Error during indexing process:", error);
        return ApiResponse.error(error instanceof Error ? error.message : "An unknown error occurred during indexing.");
    }
}


// The API route handler
export const POST = apiHandler(startIndexingProcess, ['Admin', 'SAdmin']);
    
