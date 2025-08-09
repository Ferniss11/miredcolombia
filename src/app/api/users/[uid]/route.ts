// src/app/api/users/[uid]/route.ts
import { UserController } from '@/lib/user/infrastructure/api/user.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const userController = new UserController();

type RouteContext = { params: { uid: string } };

// We need to bind the 'this' context to the controller instance
// This endpoint should be protected, e.g., only the user themselves or an admin can access it.
// For now, we will leave it open for development purposes, but in a real scenario,
// we'd add logic inside the handler or a more advanced middleware to check ownership.
export const GET = apiHandler((req: NextRequest, { params }: RouteContext) =>
  userController.getById(req, { params: { id: params.uid } })
);

export const PUT = apiHandler((req: NextRequest, { params }: RouteContext) =>
  userController.update(req, { params: { id: params.uid } })
);

// Deleting a user should be a highly protected action.
export const DELETE = apiHandler((req: NextRequest, { params }: RouteContext) =>
  userController.delete(req, { params: { id: params.uid } }), 
  ['Admin'] // Only Admins can delete users.
);
