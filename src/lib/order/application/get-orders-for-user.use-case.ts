// src/lib/order/application/get-orders-for-user.use-case.ts
import type { Order } from '../domain/order.entity';
import type { OrderRepository } from '../domain/order.repository';

export type GetOrdersForUserInput = {
  userId: string;
};

/**
 * Use case for retrieving all orders placed by a specific user.
 */
export class GetOrdersForUserUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute({ userId }: GetOrdersForUserInput): Promise<Order[]> {
    return this.orderRepository.findAllByUserId(userId);
  }
}
