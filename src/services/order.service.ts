
import { adminDb, adminInstance } from "@/lib/firebase/admin-config";
import type { Order } from "@/lib/types";

const FieldValue = adminInstance?.firestore.FieldValue;

/**
 * Creates a new order document in Firestore.
 * @param orderData - The data for the order to be created.
 * @returns The ID of the newly created order document.
 */
export async function createOrder(orderData: Omit<Order, 'createdAt' | 'id'>): Promise<string> {
  const db = adminDb;
  if (!db || !FieldValue) {
    throw new Error("Firebase Admin SDK is not initialized. Cannot create order.");
  }
  try {
    const docRef = await db.collection("orders").add({
      ...orderData,
      createdAt: FieldValue.serverTimestamp(),
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
