
// src/lib/order/application/create-order.use-case.ts
import type { Customer, Order } from '../domain/order.entity';
import type { OrderRepository } from '../domain/order.repository';
import { EmailAutomationService } from '@/lib/email-sequence/domain/email-automation.service';
import { GetSequenceByTriggerUseCase } from '@/lib/email-sequence/application/get-sequence-by-trigger.use-case';
import { FirestoreEmailSequenceRepository } from '@/lib/email-sequence/infrastructure/persistence/firestore-email-sequence.repository';


// Input for creating the customer part of the order
export type CreateOrderCustomerInput = {
    userId?: string | null;
    firstName: string;
    lastName: string;
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
 * creating the order, and triggering any post-order automations.
 */
export class CreateOrderUseCase {
  private orderRepository: OrderRepository;
  private emailAutomationService: EmailAutomationService;
  private getSequenceByTriggerUseCase: GetSequenceByTriggerUseCase;

  constructor(orderRepository: OrderRepository) {
    this.orderRepository = orderRepository;
    this.emailAutomationService = new EmailAutomationService();
    // Instantiate dependencies for the use case directly
    const emailSequenceRepository = new FirestoreEmailSequenceRepository();
    this.getSequenceByTriggerUseCase = new GetSequenceByTriggerUseCase(emailSequenceRepository);
  }

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
      status: 'succeeded',
      ...orderDetails,
    };
    const newOrder = await this.orderRepository.createOrder(orderToCreate);
    
    // Step 3: Trigger automations if applicable.
    if (newOrder.provider === 'lead_magnet') {
        const sequence = await this.getSequenceByTriggerUseCase.execute('on_guide_download');
        if (sequence) {
            await this.emailAutomationService.scheduleSequence(sequence, customer, newOrder);
        } else {
            console.warn(`[CreateOrderUseCase] No active email sequence found for trigger 'on_guide_download'.`);
        }
    }
    
    return newOrder;
  }
}
