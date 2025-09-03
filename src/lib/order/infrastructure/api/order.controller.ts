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
  guideId: z.string().min(1).optional(),      // For guide downloads
  guideTitle: z.string().min(1).optional(),  // For guide downloads
  packageName: z.string().min(1).optional(), // For quote requests
  travelDate: z.string().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
  servicesNeeded: z.array(z.string()).optional(),
  message: z.string().optional(),
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

    const itemId = input.guideId || input.packageName?.toLowerCase().replace(/\s/g, '_') || 'quote_request';
    
    // Create a more descriptive item name for the order
    let itemName = `Solicitud de presupuesto: ${input.packageName}`;
    if (input.guideTitle) {
      itemName = `Descarga de Guía: ${input.guideTitle}`;
    } else if (input.packageName) {
        const details = [
            input.adults ? `${input.adults} adulto(s)` : '',
            input.children ? `${input.children} niño(s)` : '',
            input.servicesNeeded && input.servicesNeeded.length > 0 ? `Servicios: ${input.servicesNeeded.join(', ')}` : '',
            input.message ? `Mensaje: ${input.message}` : ''
        ].filter(Boolean).join(' | ');

        if (details) {
            itemName += ` (${details})`;
        }
    }


    const newOrder = await this.createOrderUseCase.execute(
      { // Customer Info
        firstName: input.firstName,
        lastName: '', // Not required for lead magnet/quote
        email: input.email,
        phone: input.phone,
      },
      { // Order Info
        itemId: itemId,
        itemName: itemName, // Use the more descriptive name
        amount: 0,
        currency: 'eur',
        provider: 'lead_magnet',
      }
    );

    return ApiResponse.created(newOrder);
  }
}
