// src/app/api/real-estate/route.ts
import { PropertyController } from '@/lib/real-estate/infrastructure/api/property.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const propertyController = new PropertyController();

// Create a new property listing (protected)
export const POST = apiHandler((req) => 
  propertyController.create(req)
, ['User', 'Admin', 'SAdmin', 'Advertiser']);

// Get all property listings (public)
export const GET = apiHandler((req: NextRequest) =>
  propertyController.getAll(req)
);
