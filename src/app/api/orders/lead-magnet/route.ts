// src/app/api/orders/lead-magnet/route.ts
import { OrderController } from '@/lib/order/infrastructure/api/order.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';

const orderController = new OrderController();

// This endpoint is public for anyone to download a guide or request a quote
export const POST = apiHandler((req) => 
  orderController.createLeadMagnetOrder(req)
);
