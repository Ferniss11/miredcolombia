// src/app/api/users/[uid]/business-profile/route.ts
import { UserController } from '@/lib/user/infrastructure/api/user.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const userController = new UserController();

type RouteContext = { params: { uid: string } };

export const PUT = apiHandler((req: NextRequest, { params }: RouteContext) =>
  userController.updateBusinessProfile(req, { params: { id: params.uid } })
);
