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

// Zod schema for validating FormData
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

        const data = GuideFormSchema.parse({
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
        });
        
        const [coverImageUrl, pdfUrl] = await Promise.all([
            uploadFile(Buffer.from(await coverImageFile.arrayBuffer()), `guides/${uid}/${Date.now()}-${coverImageFile.name}`, coverImageFile.type),
            uploadFile(Buffer.from(await pdfFile.arrayBuffer()), `guides/${uid}/${Date.now()}-${pdfFile.name}`, pdfFile.type)
        ]);

        const newGuide = await this.createUseCase.execute({ ...data, coverImageUrl, pdfUrl });
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
        const data = GuideFormSchema.parse({
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
        });

        const coverImageFile = formData.get('coverImageFile') as File | null;
        const pdfFile = formData.get('pdfFile') as File | null;
        
        let coverImageUrl: string | undefined = undefined;
        let pdfUrl: string | undefined = undefined;

        if (coverImageFile) {
            coverImageUrl = await uploadFile(Buffer.from(await coverImageFile.arrayBuffer()), `guides/${uid}/${Date.now()}-${coverImageFile.name}`, coverImageFile.type);
        }
        if (pdfFile) {
            pdfUrl = await uploadFile(Buffer.from(await pdfFile.arrayBuffer()), `guides/${uid}/${Date.now()}-${pdfFile.name}`, pdfFile.type);
        }

        const updatedGuide = await this.updateUseCase.execute(params.id, { ...data, coverImageUrl, pdfUrl });
        return ApiResponse.success(updatedGuide);
    }

    async delete({ params }: { params: { id: string } }): Promise<NextResponse> {
        await this.deleteUseCase.execute(params.id);
        // Note: This does not delete files from storage. A more robust implementation would.
        return ApiResponse.noContent();
    }
}
