// src/lib/directory/infrastructure/api/directory.controller.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { getFirebaseServices } from '@/lib/firebase/config';
import { adminAuth } from '@/lib/firebase/admin-config';

// Repositories
import { FirestoreDirectoryRepository } from '../persistence/firestore-directory.repository';
import { FirestoreUserRepository } from '@/lib/user/infrastructure/persistence/firestore-user.repository';
import { GooglePlacesAdapter } from '../search/google-places.adapter';
import { FirestoreCacheAdapter } from '../cache/firestore-cache.adapter';

// Use Cases
import { AddBusinessUseCase } from '../../application/add-business.use-case';
import { DeleteBusinessUseCase } from '../../application/delete-business.use-case';
import { GetBusinessDetailsUseCase } from '../../application/get-business-details.use-case';
import { LinkBusinessToUserUseCase } from '../../application/link-business-to-user.use-case';
import { ApproveBusinessVerificationUseCase } from '../../application/approve-business-verification.use-case';
import { Business } from '../../domain/business.entity';

// --- Input Validation Schemas ---
const AddBusinessSchema = z.object({
  placeId: z.string().min(1, "Place ID is required."),
  category: z.string().min(1, "Category is required."),
});

const LinkBusinessSchema = z.object({
  placeId: z.string().min(1, "Place ID is required."),
  phone: z.string().min(1, "Phone number is required."),
});

const ApproveBusinessSchema = z.object({
  placeId: z.string().min(1, "Place ID is required."),
  ownerUid: z.string().min(1, "Owner UID is required."),
  status: z.enum(['approved', 'rejected']),
});


export class DirectoryController {
  private addBusinessUseCase: AddBusinessUseCase;
  private deleteBusinessUseCase: DeleteBusinessUseCase;
  private getBusinessDetailsUseCase: GetBusinessDetailsUseCase;
  private linkBusinessToUserUseCase: LinkBusinessToUserUseCase;
  private approveBusinessVerificationUseCase: ApproveBusinessVerificationUseCase;

  constructor() {
    // Instantiate infrastructure adapters
    const directoryRepository = new FirestoreDirectoryRepository();
    const userRepository = new FirestoreUserRepository();
    const searchAdapter = new GooglePlacesAdapter();
    const cacheAdapter = new FirestoreCacheAdapter();
    
    // Instantiate use cases and inject dependencies
    this.addBusinessUseCase = new AddBusinessUseCase(directoryRepository);
    this.deleteBusinessUseCase = new DeleteBusinessUseCase(directoryRepository);
    this.getBusinessDetailsUseCase = new GetBusinessDetailsUseCase(directoryRepository, searchAdapter, cacheAdapter);
    this.linkBusinessToUserUseCase = new LinkBusinessToUserUseCase(directoryRepository, userRepository, searchAdapter);
    this.approveBusinessVerificationUseCase = new ApproveBusinessVerificationUseCase(directoryRepository, userRepository);
  }

  /**
   * Handles adding a new business to the directory.
   * Linked to POST /api/directory
   */
  async add(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    const { placeId, category } = AddBusinessSchema.parse(json);
    
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return ApiResponse.unauthorized();
    const { uid: adminUid } = await adminAuth.verifyIdToken(token);

    const newBusiness = await this.addBusinessUseCase.execute({ placeId, category, adminUid });
    return ApiResponse.created(newBusiness);
  }

  /**
   * Handles getting details for a single business.
   * Linked to GET /api/directory/[id]
   */
  async getById(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
    const business = await this.getBusinessDetailsUseCase.execute(params.id);
    if (!business) {
        return ApiResponse.notFound(`Business with id ${params.id} not found.`);
    }
    return ApiResponse.success(business);
  }

  /**
   * Handles deleting a business from the directory.
   * Linked to DELETE /api/directory/[id]
   */
  async delete(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
    await this.deleteBusinessUseCase.execute(params.id);
    return ApiResponse.noContent();
  }
  
  /**
   * Handles an advertiser claiming a business.
   * Linked to POST /api/directory/link
   */
  async linkToUser(req: NextRequest): Promise<ApiResponse> {
      const json = await req.json();
      const { placeId, phone } = LinkBusinessSchema.parse(json);

      const token = req.headers.get('Authorization')?.split('Bearer ')[1];
      if (!token) return ApiResponse.unauthorized();
      const { uid: userId } = await adminAuth.verifyIdToken(token);

      const business = await this.linkBusinessToUserUseCase.execute({ userId, placeId, providedPhone: phone });
      return ApiResponse.success(business);
  }

  /**
   * Handles an admin approving a business verification request.
   * Linked to POST /api/directory/approve
   */
  async approveVerification(req: NextRequest): Promise<ApiResponse> {
      const json = await req.json();
      const { placeId, ownerUid, status } = ApproveBusinessSchema.parse(json);

      await this.approveBusinessVerificationUseCase.execute({ placeId, ownerUid, status });
      return ApiResponse.success({ message: `Business verification status updated to ${status}.` });
  }

  // Note: We're not implementing getAll or a generic update for the whole Business entity
  // through the BaseController interface, as those are not required by the current roadmap.
  // They can be added here if needed in the future.
  async getAll(req: NextRequest) { return ApiResponse.notImplemented(); }
  async update(req: NextRequest, { params }: { params: { id: string; }; }) { return ApiResponse.notImplemented(); }

}
