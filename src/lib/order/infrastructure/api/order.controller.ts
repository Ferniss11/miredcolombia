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
  guideId: z.string().min(1), // Can be a guide ID or a package ID
  guideTitle: z.string().min(1), // Can be guide title or package name for quote
  message: z.string().optional(), // For quote requests
});

export class OrderController {
  private createOrderUseCase: CreateOrderUseCase;

  constructor() {
    const orderRepository = new FirestoreOrderRepository();
    this.createOrderUseCase = new CreateOrderUseCase(orderRepository);
  }

  /**
   * Handles creating an order for a lead magnet (e.g., guide download or pack quote).
   * Linked to POST /api/orders/lead-magnet
   */
  async createLeadMagnetOrder(req: NextRequest): Promise<ApiResponse> {
    const json = await req.json();
    const input = LeadMagnetSchema.parse(json);

    // Concatenate the user's message to the item name for context
    const itemName = input.message 
        ? `${input.guideTitle} (Mensaje: ${input.message})`
        : `Guía: ${input.guideTitle}`;

    const newOrder = await this.createOrderUseCase.execute(
      { // Customer Info
        firstName: input.firstName,
        lastName: '', // Not required for lead magnet
        email: input.email,
        phone: input.phone,
      },
      { // Order Info
        itemId: input.guideId,
        itemName: itemName,
        amount: 0,
        currency: 'eur',
        provider: 'lead_magnet',
      }
    );

    return ApiResponse.created(newOrder);
  }
}
