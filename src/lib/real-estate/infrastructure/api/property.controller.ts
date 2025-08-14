// src/lib/real-estate/infrastructure/api/property.controller.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { adminAuth } from '@/lib/firebase/admin-config';
import type { UserRole } from '@/lib/user/domain/user.entity';

// Infrastructure
import { FirestorePropertyRepository } from '../persistence/firestore-property.repository';

// Application Use Cases
import { CreatePropertyUseCase } from '../../application/create-property.use-case';
import { GetAllPropertiesUseCase } from '../../application/get-all-properties.use-case';
import { GetPropertyUseCase } from '../../application/get-property.use-case';
import { UpdatePropertyUseCase } from '../../application/update-property.use-case';
import { DeletePropertyUseCase } from '../../application/delete-property.use-case';
import { UpdatePropertyStatusUseCase } from '../../application/update-property-status.use-case';
import { GetUserProfileUseCase } from '@/lib/user/application/get-user-profile.use-case';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';


export class PropertyController {
    private createUseCase: CreatePropertyUseCase;
    private getAllUseCase: GetAllPropertiesUseCase;
    private getByIdUseCase: GetPropertyUseCase;
    private updateUseCase: UpdatePropertyUseCase;
    private deleteUseCase: DeletePropertyUseCase;
    private updateStatusUseCase: UpdatePropertyStatusUseCase;
    private getUserProfileUseCase: GetUserProfileUseCase;

    constructor() {
        const repository = new FirestorePropertyRepository();
        const userRepository = new FirestoreUserRepository();

        this.createUseCase = new CreatePropertyUseCase(repository);
        this.getAllUseCase = new GetAllPropertiesUseCase(repository);
        this.getByIdUseCase = new GetPropertyUseCase(repository);
        this.updateUseCase = new UpdatePropertyUseCase(repository);
        this.deleteUseCase = new DeletePropertyUseCase(repository);
        this.updateStatusUseCase = new UpdatePropertyStatusUseCase(repository);
        this.getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
    }

    private async getActor(req: NextRequest): Promise<{ actorId: string, actorRoles: UserRole[] }> {
        if (!adminAuth) throw new Error('Auth not configured');
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) throw new Error('Unauthorized');
        
        const decodedToken = await adminAuth.verifyIdToken(token);
        const actorId = decodedToken.uid;
        const actorRoles = (decodedToken.roles || []) as UserRole[];
        
        return { actorId, actorRoles };
    }
    
    // This will be expanded to handle file uploads
    async create(req: NextRequest): Promise<ApiResponse> {
        const { actorId } = await this.getActor(req);
        const user = await this.getUserProfileUseCase.execute(actorId);
        if (!user) {
            return ApiResponse.unauthorized('User profile not found.');
        }

        const json = await req.json(); // Zod validation will be added here
        const newProperty = await this.createUseCase.execute(json, user);
        return ApiResponse.created(newProperty);
    }
    
    async getAll(req: NextRequest): Promise<ApiResponse> {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') as any; // any to match use case
        
        const properties = await this.getAllUseCase.execute(status);
        return ApiResponse.success(properties);
    }

    async getById(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
        const property = await this.getByIdUseCase.execute(params.id);
        if (!property) {
            return ApiResponse.notFound('Property not found.');
        }
        return ApiResponse.success(property);
    }
    
    // This will be expanded to handle file uploads
    async update(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
        const { actorId, actorRoles } = await this.getActor(req);
        const json = await req.json();
        
        const updatedProperty = await this.updateUseCase.execute(params.id, json, actorId, actorRoles);
        return ApiResponse.success(updatedProperty);
    }

    async updateStatus(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
        const { actorId, actorRoles } = await this.getActor(req);
        const { status } = await req.json();
        
        if (!['available', 'rejected', 'rented', 'sold'].includes(status)) {
            return ApiResponse.badRequest('Invalid status value.');
        }

        const updatedProperty = await this.updateStatusUseCase.execute({ propertyId: params.id, status, actorRoles });
        return ApiResponse.success(updatedProperty);
    }

    async delete(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
        const { actorId, actorRoles } = await this.getActor(req);
        await this.deleteUseCase.execute(params.id, actorId, actorRoles);
        return ApiResponse.noContent();
    }
}
