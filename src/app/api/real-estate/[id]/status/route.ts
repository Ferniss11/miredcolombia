// src/app/api/real-estate/[id]/status/route.ts
import { PropertyController } from '@/lib/real-estate/infrastructure/api/property.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const propertyController = new PropertyController();

type RouteContext = { params: { id: string } };

// This endpoint is protected for Admins to approve or reject a property
export const PUT = apiHandler((req: NextRequest, { params }: RouteContext) =>
  propertyController.updateStatus(req, { params: { id: params.id } })
, ['Admin', 'SAdmin']);
