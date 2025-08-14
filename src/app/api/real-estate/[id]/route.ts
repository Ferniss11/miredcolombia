// src/app/api/real-estate/[id]/route.ts
import { PropertyController } from '@/lib/real-estate/infrastructure/api/property.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const propertyController = new PropertyController();

type RouteContext = { params: { id: string } };

// This endpoint is public for anyone to get details about a property
export const GET = apiHandler((req: NextRequest, { params }: RouteContext) =>
  propertyController.getById(req, { params: { id: params.id } })
);

// Only the owner or an admin can update a property
export const PUT = apiHandler((req: NextRequest, { params }: RouteContext) =>
  propertyController.update(req, { params: { id: params.id } })
, ['User', 'Admin', 'SAdmin', 'Advertiser']);

// Only the owner or an admin can delete a property
export const DELETE = apiHandler((req: NextRequest, { params }: RouteContext) =>
  propertyController.delete(req, { params: { id: params.id } })
, ['User', 'Admin', 'SAdmin', 'Advertiser']);
