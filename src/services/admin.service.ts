
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
        const profile = userSnap.data() as UserProfile;
        
        // If user is an advertiser, also fetch the category from the main directory collection
        // This is a temporary measure to unify data sources until a refactor.
        if (profile.role === 'Advertiser' && profile.businessProfile?.placeId) {
            const businessRef = db.collection('directory').doc(profile.businessProfile.placeId);
            const businessSnap = await businessRef.get();
            if (businessSnap.exists && businessSnap.data()?.category) {
                if (!profile.businessProfile.category) { // Avoid overwriting if it somehow exists
                    profile.businessProfile.category = businessSnap.data()?.category;
                }
            }
        }
        return profile;
    }
    
    return null;
}
