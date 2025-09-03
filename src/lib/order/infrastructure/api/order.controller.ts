// src/lib/order/infrastructure/api/order.controller.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from '@/lib/platform/api/api-response';
import { FirestoreOrderRepository } from '../persistence/firestore-order.repository';
import { CreateOrderUseCase } from '../../application/create-order.use-case';

// --- Input Validation Schemas ---
const LeadMagnetSchema = z.object({
  firstName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  guideId: z.string().min(1),
  guideTitle: z.string().min(1),
});

export class OrderController {
  private createOrderUseCase: CreateOrderUseCase;

  constructor() {
    const orderRepository = new FirestoreOrderRepository();
    this.createOrderUseCase = new CreateOrderUseCase(orderRepository);
  }

  /**
   * Handles creating an order for a lead magnet (e.g., guide download).
   * Linked to POST /api/orders/lead-magnet
   */
  async createLeadMagnetOrder(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    const input = LeadMagnetSchema.parse(json);

    const newOrder = await this.createOrderUseCase.execute(
      { // Customer Info
        firstName: input.firstName,
        lastName: '', // Not required for lead magnet
        email: input.email,
        phone: input.phone,
      },
      { // Order Info
        itemId: input.guideId,
        itemName: `Guía: ${input.guideTitle}`,
        amount: 0,
        currency: 'eur',
        provider: 'lead_magnet',
      }
    );

    return ApiResponse.created(newOrder);
  }
}
