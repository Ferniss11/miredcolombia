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
import type { BusinessProfile } from '../../domain/user.entity';


// Schema for validating the creation of a user
const CreateUserSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['Admin', 'Advertiser', 'User']),
});


export class UserController implements Partial<BaseController> {
  private createUserUseCase: CreateUserProfileUseCase;
  private getUserUseCase: GetUserProfileUseCase;
  private updateUserUseCase: UpdateUserProfileUseCase;
  private updateBusinessProfileUseCase: UpdateBusinessProfileUseCase;

  constructor() {
    const userRepository = new FirestoreUserRepository();
    this.createUserUseCase = new CreateUserProfileUseCase(userRepository);
    this.getUserUseCase = new GetUserProfileUseCase(userRepository);
    this.updateUserUseCase = new UpdateUserProfileUseCase(userRepository);
    this.updateBusinessProfileUseCase = new UpdateBusinessProfileUseCase(userRepository);
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
   * The parameter from the route is `id`, but we map it to `uid` internally.
   * Linked to GET /api/users/[id]
   */
  async getById(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const uid = params.id; // Treat the generic 'id' from the route as 'uid'
    const user = await this.getUserUseCase.execute(uid);
    if (!user) {
      return ApiResponse.notFound(`User with id ${uid} not found.`);
    }
    return ApiResponse.success(user);
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

  // NOTE: Implement other methods like getAll, update, delete as needed based on the BaseController interface.
}
