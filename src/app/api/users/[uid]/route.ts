// src/app/api/users/[uid]/route.ts
import { UserController } from '@/lib/user/infrastructure/api/user.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const userController = new UserController();

type RouteContext = { params: { uid: string } };

// We need to bind the 'this' context to the controller instance
export const GET = apiHandler((req: NextRequest, { params }: RouteContext) =>
  userController.getById(req, { params: { id: params.uid } })
);

export const PUT = apiHandler((req: NextRequest, { params }: RouteContext) =>
  userController.update(req, { params: { id: params.uid } })
);

export const DELETE = apiHandler((req: NextRequest, { params }: RouteContext) =>
  userController.delete(req, { params: { id: params.uid } })
);
