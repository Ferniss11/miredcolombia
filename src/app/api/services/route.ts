// src/app/api/services/route.ts
import { ServiceListingController } from '@/lib/service-listing/infrastructure/api/service-listing.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const serviceListingController = new ServiceListingController();

// Anyone authenticated can create a service listing
export const POST = apiHandler((req) => 
  serviceListingController.create(req)
, ['User', 'Admin', 'SAdmin', 'Advertiser']);

// This endpoint is public for anyone to get all service listings
export const GET = apiHandler((req: NextRequest) =>
  serviceListingController.getAll(req)
);
