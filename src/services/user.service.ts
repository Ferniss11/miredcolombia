
import { doc, setDoc, getDoc, updateDoc, type Firestore } from "firebase/firestore";
import { db as clientDb } from "@/lib/firebase/config"; // Keep client DB for client-side calls
import type { UserProfile, UserRole, BusinessProfile } from "@/lib/types";
import type { User } from "firebase/auth";

export async function createUserProfile(user: User, name: string, role: UserRole = 'User'): Promise<void> {
    if (!clientDb) throw new Error("Firebase database is not initialized.");
    
    const userRef = doc(clientDb, "users", user.uid);
    
    const userProfileData: Omit<UserProfile, 'businessProfile'> = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: role,
    };

    await setDoc(userRef, userProfileData);
}

// This function can now be used on both client and server, by passing the appropriate db instance
export async function getUserProfile(uid: string, db: Firestore = clientDb): Promise<UserProfile | null> {
    if (!db) throw new Error("Firebase database is not initialized.");
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    }
    return null;
}

export async function updateBusinessProfile(uid: string, data: BusinessProfile): Promise<void> {
    if (!clientDb) throw new Error("Firebase database is not initialized.");
    try {
        const userRef = doc(clientDb, "users", uid);
        
        const updates: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                updates[`businessProfile.${key}`] = value;
            }
        }

        if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
        }

    } catch (error) {
        console.error("Firebase update error:", error);
        if (error instanceof Error) {
            throw new Error(`Error de Firebase: ${error.message}`);
        }
        throw new Error('Un error desconocido ocurrió al actualizar en Firebase.');
    }
}
