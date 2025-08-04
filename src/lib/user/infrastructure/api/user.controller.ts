// src/lib/user/infrastructure/api/user.controller.ts
import type { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { BaseController } from '@/lib/platform/api/base.controller';
import { ApiResponse } from '@/lib/platform/api/api-response';

import { FirestoreUserRepository } from '../persistence/firestore-user.repository';
import { CreateUserProfileUseCase, type CreateUserInput } from '../../application/create-user-profile.use-case';
import { GetUserProfileUseCase } from '../../application/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from '../../application/update-user-profile.use-case';
import { UpdateBusinessProfileUseCase } from '../../application/update-business-profile.use-case';
import { UpdateCandidateProfileUseCase } from '../../application/update-candidate-profile.use-case';
import { SoftDeleteUserUseCase } from '../../application/soft-delete-user.use-case';
import type { BusinessProfile, CandidateProfile } from '../../domain/user.entity';


// Schema for validating the creation of a user
const CreateUserSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['Admin', 'Advertiser', 'User']),
});

// Schema for validating updates to the basic user profile
const UpdateUserSchema = z.object({
  name: z.string().min(2),
});

// Note: Schemas for BusinessProfile and CandidateProfile would also be defined here for validation.

export class UserController implements Partial<BaseController> {
  private createUserUseCase: CreateUserProfileUseCase;
  private getUserUseCase: GetUserProfileUseCase;
  private updateUserUseCase: UpdateUserProfileUseCase;
  private updateBusinessProfileUseCase: UpdateBusinessProfileUseCase;
  private updateCandidateProfileUseCase: UpdateCandidateProfileUseCase;
  private softDeleteUserUseCase: SoftDeleteUserUseCase;

  constructor() {
    const userRepository = new FirestoreUserRepository();
    this.createUserUseCase = new CreateUserProfileUseCase(userRepository);
    this.getUserUseCase = new GetUserProfileUseCase(userRepository);
    this.updateUserUseCase = new UpdateUserProfileUseCase(userRepository);
    this.updateBusinessProfileUseCase = new UpdateBusinessProfileUseCase(userRepository);
    this.updateCandidateProfileUseCase = new UpdateCandidateProfileUseCase(userRepository);
    this.softDeleteUserUseCase = new SoftDeleteUserUseCase(userRepository);
  }

  /**
   * Handles the creation of a new user profile.
   * Linked to POST /api/users
   */
  async create(req: NextRequest): Promise<NextResponse> {
    const json = await req.json();
    const userData: CreateUserInput = CreateUserSchema.parse(json);

    const newUser = await this.createUserUseCase.execute(userData);

    return ApiResponse.created(newUser);
  }

  /**
   * Handles retrieving a user profile by their UID.
   * Linked to GET /api/users/[id]
   */
  async getById(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const uid = params.id;
    const user = await this.getUserUseCase.execute(uid);
    if (!user) {
      return ApiResponse.notFound(`User with id ${uid} not found.`);
    }
    return ApiResponse.success(user);
  }

  /**
   * Handles updating the basic profile of a user.
   * Linked to PUT /api/users/[id]
   */
  async update(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
      const uid = params.id;
      const json = await req.json();
      const userData = UpdateUserSchema.parse(json);

      const updatedUser = await this.updateUserUseCase.execute(uid, userData);
      return ApiResponse.success(updatedUser);
  }

   /**
   * Handles updating a business profile for a user.
   * Linked to PUT /api/users/[id]/business-profile
   */
  async updateBusinessProfile(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const uid = params.id;
    const json: BusinessProfile = await req.json();
    // Here you would typically validate the incoming 'json' against a Zod schema for BusinessProfile
    
    const updatedUser = await this.updateBusinessProfileUseCase.execute(uid, json);
    return ApiResponse.success(updatedUser);
  }
  
  /**
   * Handles updating a candidate profile for a user.
   * Linked to PUT /api/users/[id]/candidate-profile
   */
  async updateCandidateProfile(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const uid = params.id;
    const json: CandidateProfile = await req.json();
    // Here you would typically validate the incoming 'json' against a Zod schema for CandidateProfile

    const updatedUser = await this.updateCandidateProfileUseCase.execute(uid, json);
    return ApiResponse.success(updatedUser);
  }

  /**
   * Handles soft-deleting a user.
   * Linked to DELETE /api/users/[id]
   */
  async delete(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
      const uid = params.id;
      await this.softDeleteUserUseCase.execute(uid);
      return ApiResponse.noContent();
  }

  // NOTE: Implement 'getAll' if an endpoint to list all users is needed in the future.
}
