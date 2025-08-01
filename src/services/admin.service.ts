
import { adminDb, adminAuth } from "@/lib/firebase/admin-config";
import type { UserProfile } from "@/lib/types";

/**
 * A helper function to safely get the initialized admin services.
 * Throws an error if the services are not available.
 */
export function getAdminServices() {
    if (!adminDb || !adminAuth) {
        throw new Error("Firebase Admin SDK is not initialized. Check server environment variables.");
    }
    return { db: adminDb, auth: adminAuth };
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

/**
 * Gets the total count of registered users.
 * @returns The number of users.
 */
export async function getTotalUserCount(): Promise<number> {
    const { auth } = getAdminServices();
    try {
        // This is an expensive operation for very large user bases.
        // For smaller sites, it's fine. For larger sites, a counter
        // managed by a Cloud Function would be more efficient.
        const listUsersResult = await auth.listUsers();
        return listUsersResult.users.length;
    } catch (error) {
        console.error("Error fetching total user count:", error);
        return 0;
    }
}
