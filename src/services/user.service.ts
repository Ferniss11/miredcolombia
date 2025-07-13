
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db as clientDb } from "@/lib/firebase/config"; // Client DB for client-side calls
import type { UserProfile, UserRole } from "@/lib/types";
import type { User } from "firebase/auth";

/**
 * Creates a user profile document in Firestore.
 * This is a CLIENT-SIDE function.
 */
export async function createUserProfile(user: User, name: string, role: UserRole = 'User'): Promise<void> {
    if (!clientDb) throw new Error("Firebase client database is not initialized.");
    
    const userRef = doc(clientDb, "users", user.uid);
    
    const userProfileData: UserProfile = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: role,
    };

    if (role === 'Advertiser') {
        userProfileData.businessProfile = {
            businessName: '',
            address: '',
            phone: '',
            website: '',
            description: '',
        }
    }

    await setDoc(userRef, userProfileData);
}

/**
 * Retrieves a user's profile from Firestore.
 * This is a CLIENT-SIDE function.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!clientDb) throw new Error("Firebase client database is not initialized.");
    
    const userRef = doc(clientDb, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    }
    return null;
}

/**
 * Updates a user's profile document in Firestore.
 * This is a CLIENT-SIDE function.
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    if (!clientDb) throw new Error("Firebase client database is not initialized.");
    const userRef = doc(clientDb, "users", uid);
    await updateDoc(userRef, data);
}
