
import { adminDb } from "@/lib/firebase/admin-config";
import type { UserProfile } from "@/lib/types";

/**
 * Retrieves a user's profile from Firestore using the Admin SDK.
 * This is a SERVER-SIDE ONLY function.
 * @param uid The user's ID.
 * @returns The user profile object or null if not found.
 */
export async function getUserProfileByUid(uid: string): Promise<UserProfile | null> {
    if (!adminDb) {
        console.error("Admin DB not initialized in getUserProfile (server).");
        throw new Error("La base de datos de administración de Firebase no está inicializada.");
    }
    
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
        return userSnap.data() as UserProfile;
    }
    
    return null;
}
