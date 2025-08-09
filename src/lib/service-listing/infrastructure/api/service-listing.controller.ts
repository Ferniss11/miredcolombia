// src/lib/service-listing/infrastructure/api/service-listing.controller.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { adminAuth } from '@/lib/firebase/admin-config';

// Infrastructure
import { FirestoreServiceListingRepository } from '../persistence/firestore-service-listing.repository';

// Application Use Cases
import { CreateServiceListingUseCase } from '../../application/create-service-listing.use-case';
import { GetAllServiceListingsUseCase } from '../../application/get-all-service-listings.use-case';
import { GetServiceListingUseCase } from '../../application/get-service-listing.use-case';
import { UpdateServiceListingUseCase } from '../../application/update-service-listing.use-case';
import { DeleteServiceListingUseCase } from '../../application/delete-service-listing.use-case';
import type { UserRole } from '@/lib/user/domain/user.entity';

// Validation Schemas
const ServiceListingSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  category: z.string().min(1),
  city: z.string().min(1),
  price: z.number().min(0),
  priceType: z.enum(['per_hour', 'fixed', 'per_project']),
  contactPhone: z.string().min(7),
  contactEmail: z.string().email(),
});

export class ServiceListingController {
  private createUseCase: CreateServiceListingUseCase;
  private getAllUseCase: GetAllServiceListingsUseCase;
  private getByIdUseCase: GetServiceListingUseCase;
  private updateUseCase: UpdateServiceListingUseCase;
  private deleteUseCase: DeleteServiceListingUseCase;

  constructor() {
    const repository = new FirestoreServiceListingRepository();
    this.createUseCase = new CreateServiceListingUseCase(repository);
    this.getAllUseCase = new GetAllServiceListingsUseCase(repository);
    this.getByIdUseCase = new GetServiceListingUseCase(repository);
    this.updateUseCase = new UpdateServiceListingUseCase(repository);
    this.deleteUseCase = new DeleteServiceListingUseCase(repository);
  }

  async create(req: NextRequest): Promise<ApiResponse> {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return ApiResponse.unauthorized();
    const { uid: userId } = await adminAuth.verifyIdToken(token);

    const json = await req.json();
    const data = ServiceListingSchema.parse(json);
    
    const newListing = await this.createUseCase.execute({ ...data, userId });
    return ApiResponse.created(newListing);
  }
  
  async getAll(req: NextRequest): Promise<ApiResponse> {
    const listings = await this.getAllUseCase.execute();
    return ApiResponse.success(listings);
  }

  async getById(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
    const listing = await this.getByIdUseCase.execute(params.id);
    if (!listing) {
      return ApiResponse.notFound('Service listing not found.');
    }
    return ApiResponse.success(listing);
  }

  async update(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return ApiResponse.unauthorized();
    const { uid: actorId, roles } = await adminAuth.verifyIdToken(token);
    
    const json = await req.json();
    const dataToUpdate = ServiceListingSchema.partial().parse(json);
    
    const updatedListing = await this.updateUseCase.execute(params.id, dataToUpdate, actorId, (roles || []) as UserRole[]);
    return ApiResponse.success(updatedListing);
  }

  async delete(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return ApiResponse.unauthorized();
    const { uid: actorId, roles } = await adminAuth.verifyIdToken(token);
    
    await this.deleteUseCase.execute(params.id, actorId, (roles || []) as UserRole[]);
    return ApiResponse.noContent();
  }
}
