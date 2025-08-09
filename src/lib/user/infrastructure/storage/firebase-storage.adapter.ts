// infrastructure/storage/firebase-storage.adapter.ts
import { adminStorage } from "@/lib/firebase/admin-config";

const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

/**
 * A generic function to upload a file to Firebase Storage.
 * This is a server-side function.
 * @param fileBuffer The buffer of the file to upload.
 * @param filePath The full path in the bucket where the file will be stored.
 * @param contentType The MIME type of the file.
 * @returns The public URL of the uploaded file.
 */
export async function uploadFile(fileBuffer: Buffer, filePath: string, contentType: string): Promise<string> {
  if (!adminStorage) {
    throw new Error("Firebase Admin Storage is not initialized.");
  }
  if (!BUCKET_NAME) {
    throw new Error("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is not set.");
  }

  const bucket = adminStorage.bucket(BUCKET_NAME);
  const file = bucket.file(filePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType: contentType,
      cacheControl: 'public, max-age=31536000', // Cache for 1 year for efficiency
    },
  });

  // To make the file publicly accessible without needing a signed URL each time.
  await file.makePublic();

  // Return the public URL.
  return `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;
}
