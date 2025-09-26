// src/lib/order/domain/order.repository.ts
import type { Customer, Order } from './order.entity';

/**
 * Defines the contract (port) for interacting with customer and order data persistence.
 */
export interface OrderRepository {
  /**
   * Finds a customer by their email address.
   * @param email - The email to search for.
   * @returns The Customer entity or null if not found.
   */
  findCustomerByEmail(email: string): Promise<Customer | null>;

  /**
   * Creates a new customer record.
   * @param customerData - The customer data to save.
   * @returns The newly created Customer entity.
   */
  createCustomer(customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>;
  
  /**
   * Updates an existing customer record.
   * @param customerId - The ID of the customer to update.
   * @param data - The data to update.
   * @returns The updated Customer entity.
   */
  updateCustomer(customerId: string, data: Partial<Customer>): Promise<Customer>;


  /**
   * Creates a new order record.
   * @param orderData - The order data to save.
   * @returns The newly created Order entity.
   */
  createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order>;

  /**
   * Updates the status of an existing order.
   * @param orderId - The ID of the order to update.
   * @param status - The new status of the order.
   * @param paymentId - The payment provider's ID for the transaction.
   * @returns A promise that resolves when the update is complete.
   */
  updateOrderStatus(orderId: string, status: Order['status'], paymentId: string): Promise<void>;


  /**
   * Finds all orders placed by a specific user.
   * @param userId - The UID of the user.
   * @returns An array of Order entities.
   */
  findAllByUserId(userId: string): Promise<Order[]>;
  
  /**
   * Finds an order by its Stripe Payment Intent ID.
   * @param paymentIntentId - The ID from the payment provider.
   * @returns The Order entity or null if not found.
   */
  findByPaymentIntentId(paymentIntentId: string): Promise<Order | null>;
}
