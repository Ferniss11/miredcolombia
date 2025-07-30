
'use client';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from './config';
import { getStorage } from 'firebase/storage';

const storage = getStorage();

/**
 * Uploads a user's resume (PDF) to Firebase Storage.
 * This is a client-side function.
 * 
 * @param file - The PDF file to upload.
 * @param uid - The user's unique ID.
 * @returns A promise that resolves with the public download URL of the file.
 */
export async function uploadResume(file: File, uid: string): Promise<string> {
    if (!storage) {
        throw new Error("Firebase Storage is not initialized.");
    }
    if (!uid) {
        throw new Error("User not authenticated.");
    }
    if (file.type !== 'application/pdf') {
        throw new Error("El archivo debe ser un PDF.");
    }

    const filePath = `resumes/${uid}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file to Firebase Storage:", error);
        throw new Error("No se pudo subir el archivo. Inténtalo de nuevo.");
    }
}
