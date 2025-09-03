// src/app/api/email/sequences/[id]/route.ts
import { apiHandler } from '@/lib/platform/api/api-handler';
import { EmailSequenceController } from '@/lib/email-sequence/infrastructure/api/email-sequence.controller';
import { NextRequest } from 'next/server';

const controller = new EmailSequenceController();
const adminRoles = ['Admin', 'SAdmin'];

type RouteContext = { params: { id: string } };

export const GET = apiHandler((req: NextRequest, { params }: RouteContext) =>
  controller.getById({ params })
, adminRoles);

export const PUT = apiHandler((req: NextRequest, { params }: RouteContext) =>
  controller.update(req, { params })
, adminRoles);

export const DELETE = apiHandler((req: NextRequest, { params }: RouteContext) =>
  controller.delete({ params })
, adminRoles);
