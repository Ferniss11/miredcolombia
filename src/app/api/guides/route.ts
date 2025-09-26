// src/app/api/guides/route.ts
import { GuideController } from '@/lib/guide/infrastructure/api/guide.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const guideController = new GuideController();

// Protected endpoint for admins to create a new guide
export const POST = apiHandler((req: NextRequest) => 
  guideController.create(req)
, ['Admin', 'SAdmin']);

// Public endpoint to get all guides
export const GET = apiHandler(() =>
  guideController.getAll()
);
