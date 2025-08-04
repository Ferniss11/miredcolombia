// src/lib/platform/api/api-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse } from './api-response';
import { adminAuth } from '@/lib/firebase/admin-config';
import type { UserRole } from '@/lib/user/domain/user.entity';

type Handler<T> = (req: NextRequest, params?: { params: T }) => Promise<NextResponse>;

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
  return async (req: NextRequest, params?: { params: any }): Promise<NextResponse> => {
    try {
      if (allowedRoles && allowedRoles.length > 0) {
        // --- Authentication & Authorization ---
        const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];

        if (!idToken) {
          return ApiResponse.unauthorized('No authentication token provided.');
        }

        if (!adminAuth) {
          return ApiResponse.error('Authentication service not configured.', 503);
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userRole = decodedToken.role as UserRole; // 'role' is a custom claim

        if (!userRole || !allowedRoles.includes(userRole)) {
          return ApiResponse.forbidden('You do not have permission to access this resource.');
        }
      }

      // --- Execute Controller Logic ---
      return await handler(req, params);

    } catch (err: any) {
      console.error('API Handler Error:', err);

      // --- Error Handling ---
      if (err instanceof ZodError) {
        return ApiResponse.badRequest('Validation failed', err.errors);
      }
      
      if (err.code === 'auth/id-token-expired') {
          return ApiResponse.unauthorized('Authentication token has expired.');
      }
      
      if (err.code === 'auth/argument-error') {
          return ApiResponse.unauthorized('Invalid authentication token.');
      }

      if (err instanceof Error) {
        return ApiResponse.error(err.message);
      }
      
      return ApiResponse.error('An unexpected error occurred.');
    }
  };
}
