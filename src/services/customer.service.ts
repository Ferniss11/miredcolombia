
import { adminDb, adminInstance } from "@/lib/firebase/admin-config";
import type { Customer } from "@/lib/types";

const FieldValue = adminInstance?.firestore.FieldValue;

type CustomerData = Omit<Customer, 'id' | 'createdAt'>;

function getDbInstance() {
    if (!adminDb) {
        throw new Error("Firebase Admin SDK is not initialized. Customer service is unavailable.");
    }
    return adminDb;
}

/**
 * Finds a customer by their email address.
 * @param email - The email of the customer to find.
 * @returns The customer document ID if found, otherwise null.
 */
async function findCustomerByEmail(email: string): Promise<string | null> {
    const db = getDbInstance();
    const q = db.collection("customers").where("email", "==", email).limit(1);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    }
    return null;
}

/**
 * Creates a new customer document in Firestore.
 * @param data - The customer's data.
 * @returns The ID of the newly created customer document.
 */
async function createCustomer(data: CustomerData): Promise<string> {
    const db = getDbInstance();
    if (!FieldValue) throw new Error("Firebase Admin SDK is not fully initialized.");
    try {
        const docRef = await db.collection("customers").add({
            ...data,
            createdAt: FieldValue.serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating customer in Firestore:", error);
        if (error instanceof Error) {
            throw new Error(`Error de Firebase al crear el cliente: ${error.message}`);
        }
        throw new Error('Un error desconocido ocurrió al crear el cliente en Firebase.');
    }
}


/**
 * Gets the ID of an existing customer or creates a new one.
 * @param data - The customer's data including name and email.
 * @returns The ID of the existing or newly created customer.
 */
export async function getOrCreateCustomer(data: CustomerData): Promise<string> {
    const existingCustomerId = await findCustomerByEmail(data.email);
    if (existingCustomerId) {
        return existingCustomerId;
    }
    return createCustomer(data);
}
