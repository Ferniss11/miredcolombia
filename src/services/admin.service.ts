
import { adminDb } from "@/lib/firebase/admin-config";
import type { UserProfile } from "@/lib/types";

/**
 * A helper function to safely get the initialized admin services.
 * Throws an error if the services are not available.
 */
export function getAdminServices() {
    if (!adminDb) {
        throw new Error("Firebase Admin SDK is not initialized. Check server environment variables.");
    }
    return { db: adminDb };
}


/**
 * Retrieves a user's profile from Firestore using the Admin SDK.
 * This is a SERVER-SIDE ONLY function.
 * @param uid The user's ID.
 * @returns The user profile object or null if not found.
 */
export async function getUserProfileByUid(uid: string): Promise<UserProfile | null> {
    const { db } = getAdminServices();
    
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
        return userSnap.data() as UserProfile;
    }
    
    return null;
}
