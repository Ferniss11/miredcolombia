
// src/lib/guide/infrastructure/api/guide.controller.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { adminAuth } from '@/lib/firebase/admin-config';
import { uploadFile } from '@/lib/user/infrastructure/storage/firebase-storage.adapter';


// Infrastructure
import { FirestoreGuideRepository } from '../persistence/firestore-guide.repository';

// Application Use Cases
import { CreateGuideUseCase } from '../../application/create-guide.use-case';
import { GetAllGuidesUseCase } from '../../application/get-all-guides.use-case';
import { UpdateGuideUseCase } from '../../application/update-guide.use-case';
import { DeleteGuideUseCase } from '../../application/delete-guide.use-case';
import { GetGuideUseCase } from '../../application/get-guide.use-case';

// Zod schema for validating FormData, not JSON. All values will be strings.
const GuideFormSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().min(1, 'Description is required.'),
    category: z.string().min(1, 'Category is required.'),
});


export class GuideController {
    private createUseCase: CreateGuideUseCase;
    private getAllUseCase: GetAllGuidesUseCase;
    private getByIdUseCase: GetGuideUseCase;
    private updateUseCase: UpdateGuideUseCase;
    private deleteUseCase: DeleteGuideUseCase;

    constructor() {
        const repository = new FirestoreGuideRepository();
        this.createUseCase = new CreateGuideUseCase(repository);
        this.getAllUseCase = new GetAllGuidesUseCase(repository);
        this.getByIdUseCase = new GetGuideUseCase(repository);
        this.updateUseCase = new UpdateGuideUseCase(repository);
        this.deleteUseCase = new DeleteGuideUseCase(repository);
    }

    private async handleFileUpload(file: File, userId: string, type: 'cover' | 'pdf'): Promise<string> {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = `guides/${userId}/${Date.now()}-${type}-${file.name}`;
        return uploadFile(buffer, filePath, file.type);
    }

    async create(req: NextRequest): Promise<NextResponse> {
        if (!adminAuth) return ApiResponse.error('Authentication service not configured.', 503);
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) return ApiResponse.unauthorized();
        const { uid } = await adminAuth.verifyIdToken(token);

        const formData = await req.formData();
        const coverImageFile = formData.get('coverImageFile') as File | null;
        const pdfFile = formData.get('pdfFile') as File | null;

        if (!coverImageFile || !pdfFile) {
            return ApiResponse.badRequest('Cover image and PDF file are required.');
        }

        const guideData = GuideFormSchema.parse({
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
        });

        const coverImageUrl = await this.handleFileUpload(coverImageFile, uid, 'cover');
        const pdfUrl = await this.handleFileUpload(pdfFile, uid, 'pdf');

        const newGuide = await this.createUseCase.execute({
            ...guideData,
            coverImageUrl,
            pdfUrl,
        });
        return ApiResponse.created(newGuide);
    }

    async getAll(): Promise<NextResponse> {
        const guides = await this.getAllUseCase.execute();
        return ApiResponse.success(guides);
    }

    async getById(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
        const guide = await this.getByIdUseCase.execute(params.id);
        if (!guide) {
            return ApiResponse.notFound(`Guide with id ${params.id} not found.`);
        }
        return ApiResponse.success(guide);
    }

    async update(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
        if (!adminAuth) return ApiResponse.error('Authentication service not configured.', 503);
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) return ApiResponse.unauthorized();
        const { uid } = await adminAuth.verifyIdToken(token);
        
        const formData = await req.formData();
        const coverImageFile = formData.get('coverImageFile') as File | null;
        const pdfFile = formData.get('pdfFile') as File | null;

        const dataToUpdate = GuideFormSchema.parse({
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
        });

        let coverImageUrl = formData.get('existingCoverImageUrl') as string || undefined;
        let pdfUrl = formData.get('existingPdfUrl') as string || undefined;

        if (coverImageFile) {
            coverImageUrl = await this.handleFileUpload(coverImageFile, uid, 'cover');
        }
        if (pdfFile) {
            pdfUrl = await this.handleFileUpload(pdfFile, uid, 'pdf');
        }

        const finalData = {
            ...dataToUpdate,
            coverImageUrl,
            pdfUrl,
        };

        const updatedGuide = await this.updateUseCase.execute(params.id, finalData);
        return ApiResponse.success(updatedGuide);
    }

    async delete({ params }: { params: { id: string } }): Promise<NextResponse> {
        await this.deleteUseCase.execute(params.id);
        return ApiResponse.noContent();
    }
}
