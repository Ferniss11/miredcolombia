// src/lib/platform/api/api-response.ts
import { NextResponse } from 'next/server';

/**
 * A standardized class for generating API responses.
 * This ensures consistency across all endpoints.
 */
export class ApiResponse {
  static success<T>(data: T, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
  }

  static created<T>(data: T): NextResponse {
    return this.success(data, 201);
  }

  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }
  
  static error(message: string, status: number = 500, details?: any): NextResponse {
    return NextResponse.json(
      {
        error: {
          message,
          details,
        },
      },
      { status }
    );
  }

  static badRequest(message: string = 'Bad Request', details?: any): NextResponse {
    return this.error(message, 400, details);
  }

  static unauthorized(message: string = 'Unauthorized'): NextResponse {
    return this.error(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): NextResponse {
    return this.error(message, 403);
  }

  static notFound(message: string = 'Not Found'): NextResponse {
    return this.error(message, 404);
  }

  static conflict(message: string = 'Conflict'): NextResponse {
    return this.error(message, 409);
  }

  static notImplemented(message: string = 'Not Implemented'): NextResponse {
    return this.error(message, 501);
  }
}
