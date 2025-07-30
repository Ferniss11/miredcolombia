import { adminStorage } from "@/lib/firebase/admin-config";

const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

export async function uploadImageToStorage(fileBuffer: Buffer, filePath: string, contentType: string): Promise<string> {
  if (!adminStorage) {
    throw new Error("Firebase Admin Storage is not initialized. Check admin-config.ts");
  }
  if (!BUCKET_NAME) {
    throw new Error("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is not set.");
  }

  const bucket = adminStorage.bucket(BUCKET_NAME);
  const file = bucket.file(filePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType: contentType,
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
    },
  });

  // Generate a signed URL that is publicly accessible.
  // Set an expiration date far in the future.
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '01-01-2100', // An arbitrary distant future date
  });

  return url;
}
