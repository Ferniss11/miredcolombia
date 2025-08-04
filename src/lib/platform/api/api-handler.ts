// src/lib/platform/api/api-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse } from './api-response';

type Handler<T> = (req: NextRequest, params?: { params: T }) => Promise<NextResponse>;

/**
 * A wrapper for API route handlers to provide centralized error handling and request processing.
 * @param handler - The controller method to execute for the request.
 * @returns A Next.js API route handler.
 */
export function apiHandler(handler: Handler<any>) {
  return async (req: NextRequest, params?: { params: any }): Promise<NextResponse> => {
    try {
      // Execute the actual controller logic
      return await handler(req, params);
    } catch (err) {
      console.error('API Handler Error:', err);

      if (err instanceof ZodError) {
        return ApiResponse.badRequest('Validation failed', err.errors);
      }
      
      // You can add more specific error types here
      // For example, custom error classes for domain or infrastructure errors

      if (err instanceof Error) {
        // You might want to hide verbose error messages in production
        return ApiResponse.error(err.message);
      }
      
      return ApiResponse.error('An unexpected error occurred.');
    }
  };
}
