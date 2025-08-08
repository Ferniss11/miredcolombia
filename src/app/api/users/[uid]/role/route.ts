
// src/app/api/users/[uid]/role/route.ts
import { UserController } from '@/lib/user/infrastructure/api/user.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const userController = new UserController();

type RouteContext = { params: { uid: string } };

// This endpoint is highly protected. Only Super Admins can set roles.
export const POST = apiHandler((req: NextRequest, { params }: RouteContext) =>
  userController.setRole(req, { params: { id: params.uid } })
, ['SAdmin']);

