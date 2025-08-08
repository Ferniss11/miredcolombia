// src/lib/user/infrastructure/api/user.controller.ts
import type { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { BaseController } from '@/lib/platform/api/base.controller';
import { ApiResponse } from '@/lib/platform/api/api-response';

import { FirestoreUserRepository } from '../persistence/firestore-user.repository';
import { CreateUserProfileUseCase, type CreateUserInput } from '../../application/create-user-profile.use-case';
import { GetUserProfileUseCase } from '../../application/get-user-profile.use-case';
import { GetAllUsersUseCase } from '../../application/get-all-users.use-case';
import { UpdateUserProfileUseCase } from '../../application/update-user-profile.use-case';
import { UpdateBusinessProfileUseCase } from '../../application/update-business-profile.use-case';
import { UpdateCandidateProfileUseCase } from '../../application/update-candidate-profile.use-case';
import { SoftDeleteUserUseCase } from '../../application/soft-delete-user.use-case';
import { SetUserRoleUseCase } from '../../application/set-user-role.use-case';
import type { BusinessProfile, CandidateProfile, User, UserRole } from '../../domain/user.entity';
import { adminAuth } from '@/lib/firebase/admin-config';
import { AgentConfigSchema } from '@/lib/chat-types';


// Schema for validating the creation of a user
const CreateUserSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['Admin', 'Advertiser', 'User', 'SAdmin']),
});

// Schema for validating updates to the basic user profile
const UpdateUserSchema = z.object({
  name: z.string().min(2),
});

const SetRoleSchema = z.object({
    role: z.enum(['Admin', 'Advertiser', 'User']),
});

const UpdateAgentStatusSchema = z.object({
  isAgentEnabled: z.boolean(),
});


// Note: Schemas for BusinessProfile and CandidateProfile would also be defined here for validation.

export class UserController implements BaseController {
  private createUserUseCase: CreateUserProfileUseCase;
  private getUserUseCase: GetUserProfileUseCase;
  private getAllUsersUseCase: GetAllUsersUseCase;
  private updateUserUseCase: UpdateUserProfileUseCase;
  private updateBusinessProfileUseCase: UpdateBusinessProfileUseCase;
  private updateCandidateProfileUseCase: UpdateCandidateProfileUseCase;
  private softDeleteUserUseCase: SoftDeleteUserUseCase;
  private setUserRoleUseCase: SetUserRoleUseCase;
  private userRepository: FirestoreUserRepository;

  constructor() {
    this.userRepository = new FirestoreUserRepository();
    this.createUserUseCase = new CreateUserProfileUseCase(this.userRepository);
    this.getUserUseCase = new GetUserProfileUseCase(this.userRepository);
    this.getAllUsersUseCase = new GetAllUsersUseCase(this.userRepository);
    this.updateUserUseCase = new UpdateUserProfileUseCase(this.userRepository);
    this.updateBusinessProfileUseCase = new UpdateBusinessProfileUseCase(this.userRepository);
    this.updateCandidateProfileUseCase = new UpdateCandidateProfileUseCase(this.userRepository);
    this.softDeleteUserUseCase = new SoftDeleteUserUseCase(this.userRepository);
    this.setUserRoleUseCase = new SetUserRoleUseCase(this.userRepository);
  }

  /**
   * Handles the creation of a new user profile.
   * Linked to POST /api/users
   */
  async create(req: NextRequest): Promise<NextResponse> {
    const json = await req.json();
    const userData: CreateUserInput = CreateUserSchema.parse(json);

    // Check if user already exists to prevent overwriting
    const existingUser = await this.userRepository.findByUid(userData.uid);
    if (existingUser) {
        return ApiResponse.conflict('User profile already exists.');
    }

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

  /**
   * Handles retrieving all users.
   * Linked to GET /api/users
   */
  async getAll(req: NextRequest): Promise<NextResponse> {
    const users = await this.getAllUsersUseCase.execute();
    return ApiResponse.success(users);
  }

  /**
   * Handles setting a user's role.
   * Linked to POST /api/users/[uid]/role
   */
  async setRole(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const targetUid = params.id;
    const json = await req.json();
    const { role } = SetRoleSchema.parse(json);
    
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken || !adminAuth) {
        return ApiResponse.unauthorized('Authentication required.');
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const actorUid = decodedToken.uid;


    await this.setUserRoleUseCase.execute({ targetUid, newRole: role, actorUid });
    
    return ApiResponse.success({ message: `Role for user ${targetUid} updated to ${role}`});
  }
}
