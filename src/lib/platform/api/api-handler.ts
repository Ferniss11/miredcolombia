// src/lib/platform/api/api-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse } from './api-response';
import { adminAuth } from '@/lib/firebase/admin-config';
import type { UserRole } from '@/lib/user/domain/user.entity';
import { cookies } from 'next/headers';

// The handler can now receive params which might be undefined
type Handler<T> = (req: NextRequest, params: { params: T }) => Promise<NextResponse>;

/**
 * Higher-order function to wrap API route handlers with centralized error handling,
 * request processing, and security checks (authentication and authorization).
 *
 * @param handler - The controller method to execute for the request.
 * @param allowedRoles - Optional array of roles that are allowed to access this endpoint.
 *                       If not provided, the endpoint is considered public.
 * @returns A Next.js API route handler.
 */
export function apiHandler(handler: Handler<any>, allowedRoles?: UserRole[]) {
  return async (req: NextRequest, params: { params: any }): Promise<NextResponse> => {
    try {
      if (allowedRoles && allowedRoles.length > 0) {
        // --- Authentication & Authorization ---
        let idToken: string | undefined = req.headers.get('Authorization')?.split('Bearer ')[1];
        
        if (!adminAuth) {
          return ApiResponse.error('Authentication service not configured.', 503);
        }

        // If no Bearer token, try to authenticate using the session cookie
        if (!idToken) {
            const sessionCookie = cookies().get('session')?.value;
            if (sessionCookie) {
                const decodedTokenFromCookie = await adminAuth.verifySessionCookie(sessionCookie, true);
                // We use the UID to get a fresh token if needed, but for roles, this is enough
                const userRoles = (decodedTokenFromCookie.roles || []) as UserRole[];
                const isAuthorized = userRoles.some(role => allowedRoles.includes(role));
                if (!isAuthorized) {
                     return ApiResponse.forbidden('You do not have permission to access this resource.');
                }
                // If authorized, proceed to the handler without needing to pass a token
                return await handler(req, params);
            }
        }
        
        if (!idToken) {
            return ApiResponse.unauthorized('No authentication token or session cookie provided.');
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userRoles = (decodedToken.roles || []) as UserRole[]; 

        // Check if the user has at least one of the allowed roles.
        const isAuthorized = userRoles.some(role => allowedRoles.includes(role));

        if (!isAuthorized) {
          return ApiResponse.forbidden('You do not have permission to access this resource.');
        }
      }

      // --- Execute Controller Logic ---
      return await handler(req, params);

    } catch (err: any) {
      console.error('API Handler Error:', err.stack || err);

      // --- Error Handling ---
      if (err instanceof ZodError) {
        return ApiResponse.badRequest('Validation failed', err.errors);
      }
      
      if (err.code === 'auth/id-token-expired' || err.code === 'auth/session-cookie-expired') {
          return ApiResponse.unauthorized('Authentication token/session has expired.');
      }
      
      if (err.code === 'auth/argument-error') {
          return ApiResponse.unauthorized('Invalid authentication token or session cookie.');
      }
      
      // Special handling for Firestore index errors
      if (err.message && err.message.includes('requires an index')) {
          const fullError = err.stack || err.message;
          return ApiResponse.error(
              'A database query failed. This often requires creating a composite index in Firestore.', 
              500, 
              { fullError } // Send the full error for debugging on the client
          );
      }

      if (err instanceof Error) {
        return ApiResponse.error(err.message);
      }
      
      return ApiResponse.error('An unexpected error occurred.');
    }
  };
}
