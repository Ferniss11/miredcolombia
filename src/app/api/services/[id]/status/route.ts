// src/app/api/services/[id]/status/route.ts
import { ServiceListingController } from '@/lib/service-listing/infrastructure/api/service-listing.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const serviceListingController = new ServiceListingController();

type RouteContext = { params: { id: string } };

// This endpoint is protected for Admins to approve or reject a service
export const PUT = apiHandler((req: NextRequest, { params }: RouteContext) =>
  serviceListingController.updateStatus(req, { params: { id: params.id } })
, ['Admin', 'SAdmin']);
