// src/lib/platform/api/base.controller.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Defines a standardized contract for all API controllers in the application.
 * By implementing this interface, each controller guarantees it can handle
 * standard CRUD (Create, Read, Update, Delete) operations in a consistent manner.
 * This approach promotes predictability and reusability across the API layer.
 */
export interface BaseController {
  /**
   * Handles the creation of a new resource.
   * Corresponds to a POST request on a collection endpoint (e.g., POST /api/users).
   * @param req - The incoming Next.js request object.
   * @returns A promise that resolves with a NextResponse object.
   */
  create(req: NextRequest): Promise<NextResponse>;

  /**
   * Retrieves all resources in a collection.
   * Corresponds to a GET request on a collection endpoint (e.g., GET /api/directory).
   * @param req - The incoming Next.js request object.
   * @returns A promise that resolves with a NextResponse object containing the list of resources.
   */
  getAll(req: NextRequest): Promise<NextResponse>;

  /**
   * Retrieves a single resource by its unique identifier.
   * Corresponds to a GET request on a specific resource endpoint (e.g., GET /api/users/{id}).
   * @param req - The incoming Next.js request object.
   * @param params - An object containing the route parameters, including the resource 'id'.
   * @returns A promise that resolves with a NextResponse object containing the resource.
   */
  getById(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse>;

  /**
   * Updates an existing resource by its unique identifier.
   * Corresponds to a PUT or PATCH request on a specific resource endpoint (e.g., PUT /api/users/{id}).
   * @param req - The incoming Next.js request object.
   * @param params - An object containing the route parameters, including the resource 'id'.
   * @returns A promise that resolves with a NextResponse object containing the updated resource.
   */
  update(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse>;

  /**
   * Deletes a resource by its unique identifier.
   * Corresponds to a DELETE request on a specific resource endpoint (e.g., DELETE /api/users/{id}).
   * @param req - The incoming Next.js request object.
   * @param params - An object containing the route parameters, including the resource 'id'.
   * @returns A promise that resolves with a NextResponse object, typically with a 204 No Content status.
   */
  delete(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse>;
}
