import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Order } from "@/lib/types";

/**
 * Creates a new order document in Firestore.
 * @param orderData - The data for the order to be created.
 * @returns The ID of the newly created order document.
 */
export async function createOrder(orderData: Omit<Order, 'createdAt' | 'id'>): Promise<string> {
  try {
    const ordersCollection = collection(db, "orders");
    const docRef = await addDoc(ordersCollection, {
      ...orderData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating order in Firestore:", error);
    if (error instanceof Error) {
        throw new Error(`Error de Firebase al crear el pedido: ${error.message}`);
    }
    throw new Error('Un error desconocido ocurrió al crear el pedido en Firebase.');
  }
}
