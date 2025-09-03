// src/lib/email-sequence/infrastructure/api/email-sequence.controller.ts
import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { FirestoreEmailSequenceRepository } from '../persistence/firestore-email-sequence.repository';
import { CreateEmailSequenceUseCase } from '../../application/create-email-sequence.use-case';
import { GetAllEmailSequencesUseCase } from '../../application/get-all-email-sequences.use-case';
import { GetEmailSequenceUseCase } from '../../application/get-email-sequence.use-case';
import { UpdateEmailSequenceUseCase } from '../../application/update-email-sequence.use-case';
import { DeleteEmailSequenceUseCase } from '../../application/delete-email-sequence.use-case';
import { z } from 'zod';
import { EmailStepSchema } from '../../domain/email-sequence.entity';


const CreateSequenceSchema = z.object({
  name: z.string().min(3, "El nombre es muy corto."),
  trigger: z.enum(['on_guide_download', 'on_user_signup', 'on_service_purchase']),
  isActive: z.boolean().default(true),
});

const UpdateSequenceSchema = z.object({
  name: z.string().min(3).optional(),
  isActive: z.boolean().optional(),
  steps: z.array(EmailStepSchema).optional(),
});


export class EmailSequenceController {
  private createUseCase: CreateEmailSequenceUseCase;
  private getAllUseCase: GetAllEmailSequencesUseCase;
  private getByIdUseCase: GetEmailSequenceUseCase;
  private updateUseCase: UpdateEmailSequenceUseCase;
  private deleteUseCase: DeleteEmailSequenceUseCase;

  constructor() {
    const repository = new FirestoreEmailSequenceRepository();
    this.createUseCase = new CreateEmailSequenceUseCase(repository);
    this.getAllUseCase = new GetAllEmailSequencesUseCase(repository);
    this.getByIdUseCase = new GetEmailSequenceUseCase(repository);
    this.updateUseCase = new UpdateEmailSequenceUseCase(repository);
    this.deleteUseCase = new DeleteEmailSequenceUseCase(repository);
  }

  async create(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    const data = CreateSequenceSchema.parse(json);
    const sequence = await this.createUseCase.execute({ ...data, steps: [] });
    return ApiResponse.created(sequence);
  }
  
  async getAll(): Promise<ApiResponse> {
    const sequences = await this.getAllUseCase.execute();
    return ApiResponse.success(sequences);
  }

  async getById({ params }: { params: { id: string } }): Promise<ApiResponse> {
    const sequence = await this.getByIdUseCase.execute(params.id);
    if (!sequence) {
      return ApiResponse.notFound('Sequence not found.');
    }
    return ApiResponse.success(sequence);
  }
  
  async update(req: NextRequest, { params }: { params: { id: string } }): Promise<ApiResponse> {
    const json = await req.json();
    const data = UpdateSequenceSchema.parse(json);
    const updatedSequence = await this.updateUseCase.execute(params.id, data);
    return ApiResponse.success(updatedSequence);
  }

  async delete({ params }: { params: { id: string } }): Promise<ApiResponse> {
    await this.deleteUseCase.execute(params.id);
    return ApiResponse.noContent();
  }
}
