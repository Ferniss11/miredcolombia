
// src/lib/guide/infrastructure/api/guide.controller.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { adminAuth } from '@/lib/firebase/admin-config';

// Infrastructure
import { FirestoreGuideRepository } from '../persistence/firestore-guide.repository';

// Application Use Cases
import { CreateGuideUseCase } from '../../application/create-guide.use-case';
import { GetAllGuidesUseCase } from '../../application/get-all-guides.use-case';
import { UpdateGuideUseCase } from '../../application/update-guide.use-case';
import { DeleteGuideUseCase } from '../../application/delete-guide.use-case';
import { GetGuideUseCase } from '../../application/get-guide.use-case';

// Zod schema for validating JSON body, now receiving URLs instead of files
const GuidePayloadSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().min(1, 'Description is required.'),
    category: z.string().min(1, 'Category is required.'),
    coverImageUrl: z.string().url('A valid cover image URL is required.'),
    pdfUrl: z.string().url('A valid PDF URL is required.'),
});

const UpdateGuidePayloadSchema = GuidePayloadSchema.partial();


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

        const json = await req.json();
        const data = GuidePayloadSchema.parse(json);
        
        const newGuide = await this.createUseCase.execute(data);
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
        
        const json = await req.json();
        const data = UpdateGuidePayloadSchema.parse(json);

        const updatedGuide = await this.updateUseCase.execute(params.id, data);
        return ApiResponse.success(updatedGuide);
    }

    async delete({ params }: { params: { id: string } }): Promise<NextResponse> {
        await this.deleteUseCase.execute(params.id);
        // Note: This does not delete files from storage. A more robust implementation would.
        return ApiResponse.noContent();
    }
}
