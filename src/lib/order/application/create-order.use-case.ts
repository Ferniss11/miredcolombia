// src/lib/order/application/create-order.use-case.ts
import type { Customer, Order } from '../domain/order.entity';
import type { OrderRepository } from '../domain/order.repository';

// Input for creating the customer part of the order
export type CreateOrderCustomerInput = {
    userId?: string | null;
    firstName: string;
    lastName: string; // Made optional for lead magnet forms
    email: string;
    phone?: string;
};

// Input for creating the order part
export type CreateOrderDetailsInput = {
    itemId: string;
    itemName: string;
    amount: number;
    currency: string;
    provider: 'stripe' | 'lead_magnet';
    providerPaymentId?: string; // Optional for non-payment orders
};

/**
 * Use case for creating an order.
 * It encapsulates the logic of finding or creating a customer,
 * and then creating the order associated with that customer.
 */
export class CreateOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(
    customerInfo: CreateOrderCustomerInput,
    orderDetails: CreateOrderDetailsInput
  ): Promise<Order> {
    
    // Step 1: Find or create the customer.
    let customer = await this.orderRepository.findCustomerByEmail(customerInfo.email);

    if (!customer) {
      customer = await this.orderRepository.createCustomer({
        userId: customerInfo.userId,
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
      });
    }
    
    // Step 2: Create the order and link it to the customer.
    const orderToCreate: Omit<Order, 'id' | 'createdAt'> = {
      customerId: customer.id,
      userId: customerInfo.userId,
      status: 'succeeded', // For lead magnets, status is always 'succeeded'
      ...orderDetails,
    };
    
    const newOrder = await this.orderRepository.createOrder(orderToCreate);
    
    return newOrder;
  }
}
