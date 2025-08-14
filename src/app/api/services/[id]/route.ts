// src/app/api/services/[id]/route.ts
import { ServiceListingController } from '@/lib/service-listing/infrastructure/api/service-listing.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const serviceListingController = new ServiceListingController();

type RouteContext = { params: { id: string } };

// This endpoint is public for anyone to get details about a service
export const GET = apiHandler((req: NextRequest, { params }: RouteContext) =>
  serviceListingController.getById(req, { params: { id: params.id } })
);

// Only the owner of the service or an admin can update it
export const POST = apiHandler((req: NextRequest, { params }: RouteContext) =>
  serviceListingController.update(req, { params: { id: params.id } })
, ['User', 'Admin', 'SAdmin', 'Advertiser']);


// Only the owner of the service or an admin can delete it
export const DELETE = apiHandler((req: NextRequest, { params }: RouteContext) =>
  serviceListingController.delete(req, { params: { id: params.id } })
, ['User', 'Admin', 'SAdmin', 'Advertiser']);