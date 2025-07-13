
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db as clientDb } from "@/lib/firebase/config"; // Client DB for client-side calls
import { adminDb } from "@/lib/firebase/admin-config"; // Admin DB for server-side calls
import type { UserProfile, UserRole } from "@/lib/types";
import type { User } from "firebase/auth";

export async function createUserProfile(user: User, name: string, role: UserRole = 'User'): Promise<void> {
    if (!clientDb) throw new Error("Firebase client database is not initialized.");
    
    const userRef = doc(clientDb, "users", user.uid);
    
    const userProfileData: UserProfile = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: role,
    };

    await setDoc(userRef, userProfileData);
}

// This function can be used on both client and server, as it now uses the correct db instance
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    // When called from the server (API routes), adminDb will be used.
    // When called from the client, clientDb will be used.
    const db = adminDb || clientDb;
    if (!db) throw new Error("Firebase database is not initialized.");
    
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    }
    return null;
}
