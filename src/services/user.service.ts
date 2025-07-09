import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UserProfile, UserRole, BusinessProfile } from "@/lib/types";
import type { User } from "firebase/auth";

export async function createUserProfile(user: User, name: string, role: UserRole = 'User'): Promise<void> {
    const userRef = doc(db, "users", user.uid);
    const userProfileData: UserProfile = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: role,
    };
    await setDoc(userRef, userProfileData);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    }
    return null;
}

export async function updateBusinessProfile(uid: string, data: BusinessProfile): Promise<void> {
    try {
        const userRef = doc(db, "users", uid);
        
        // Use dot notation to update nested fields which is safer for security rules
        const updates: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(data)) {
            // Only update if the value is not undefined, to avoid Firebase errors
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
