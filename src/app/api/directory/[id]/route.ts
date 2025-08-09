// src/app/api/directory/[id]/route.ts
import { DirectoryController } from '@/lib/directory/infrastructure/api/directory.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const directoryController = new DirectoryController();

type RouteContext = { params: { id: string } };

// This endpoint is public for anyone to get details about a business
export const GET = apiHandler((req: NextRequest, { params }: RouteContext) =>
  directoryController.getById(req, { params: { id: params.id } })
);

// Only Admins and Super Admins can delete a business
export const DELETE = apiHandler((req: NextRequest, { params }: RouteContext) =>
  directoryController.delete(req, { params: { id: params.id } })
, ['Admin', 'SAdmin']);
