// src/app/api/guides/[id]/route.ts
import { GuideController } from '@/lib/guide/infrastructure/api/guide.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const guideController = new GuideController();

type RouteContext = { params: { id: string } };

// Public endpoint to get a single guide
export const GET = async (req: NextRequest, { params }: RouteContext) => {
    // This is a simplified version, as getById is not explicitly defined in controller but would be needed
    return new Response('Not Implemented', { status: 501 });
};

// Protected endpoint for admins to update a guide
export const POST = apiHandler((req: NextRequest, { params }: RouteContext) =>
  guideController.update(req, { params: { id: params.id } })
, ['Admin', 'SAdmin']);

// Protected endpoint for admins to delete a guide
export const DELETE = apiHandler((req: NextRequest, { params }: RouteContext) =>
  guideController.delete({ params: { id: params.id } })
, ['Admin', 'SAdmin']);
