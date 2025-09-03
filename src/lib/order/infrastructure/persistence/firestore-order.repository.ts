
// src/lib/order/infrastructure/persistence/firestore-order.repository.ts
import type { Customer, Order } from '../../domain/order.entity';
import type { OrderRepository } from '../../domain/order.repository';
import { adminDb, adminInstance } from '@/lib/firebase/admin-config';
import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const CUSTOMERS_COLLECTION = 'customers';
const ORDERS_COLLECTION = 'orders';

const toCustomer = (doc: DocumentSnapshot): Customer => {
    const data = doc.data() as DocumentData;
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
    } as Customer;
}

const toOrder = (doc: DocumentSnapshot): Order => {
    const data = doc.data() as DocumentData;
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
    } as Order;
}


export class FirestoreOrderRepository implements OrderRepository {
    private getDb() {
        if (!adminDb || !adminInstance?.firestore?.FieldValue) {
            throw new Error('Firestore not initialized or FieldValue is unavailable.');
        }
        return adminDb;
    }

    async findCustomerByEmail(email: string): Promise<Customer | null> {
        const db = this.getDb();
        const snapshot = await db.collection(CUSTOMERS_COLLECTION)
            .where('email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }
        return toCustomer(snapshot.docs[0]);
    }

    async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
        const db = this.getDb();
        const docRef = db.collection(CUSTOMERS_COLLECTION).doc();
        const newCustomerData = {
            ...customerData,
            userId: customerData.userId || null, // Ensure undefined becomes null
            createdAt: adminInstance!.firestore.FieldValue.serverTimestamp(),
        };
        await docRef.set(newCustomerData);
        const newDoc = await docRef.get();
        return toCustomer(newDoc);
    }
    
     async updateCustomer(customerId: string, data: Partial<Customer>): Promise<Customer> {
        const db = this.getDb();
        const docRef = db.collection(CUSTOMERS_COLLECTION).doc(customerId);
        await docRef.update(data);
        const updatedDoc = await docRef.get();
        return toCustomer(updatedDoc);
    }


    async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
        const db = this.getDb();
        const docRef = db.collection(ORDERS_COLLECTION).doc();
        const newOrderData = {
            ...orderData,
            status: orderData.status || 'pending', // Default to pending for payment intents
            userId: orderData.userId || null, // Ensure undefined becomes null
            createdAt: adminInstance!.firestore.FieldValue.serverTimestamp(),
        };
        await docRef.set(newOrderData);
        const newDoc = await docRef.get();
        return toOrder(newDoc);
    }
    
    async updateOrderStatus(orderId: string, status: Order['status'], paymentId: string): Promise<void> {
        const db = this.getDb();
        const docRef = db.collection(ORDERS_COLLECTION).doc(orderId);
        await docRef.update({
            status: status,
            providerPaymentId: paymentId,
        });
    }

    async findAllByUserId(userId: string): Promise<Order[]> {
        const db = this.getDb();
        const snapshot = await db.collection(ORDERS_COLLECTION)
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => toOrder(doc));
    }
}
