// src/app/api/users/route.ts
import { UserController } from '@/lib/user/infrastructure/api/user.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const userController = new UserController();

// We need to bind the 'this' context to the controller instance
export const POST = apiHandler((req) => userController.create(req));

// Example of a protected route: Only Admins can get all users.
export const GET = apiHandler((req) => userController.getAll(req), ['Admin']);
