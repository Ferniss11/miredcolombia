// src/app/api/blog/[id]/route.ts
import { BlogController } from '@/lib/blog/infrastructure/api/blog.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const blogController = new BlogController();

type RouteContext = { params: { id: string } };

// This endpoint is public for anyone to get details about a blog post
export const GET = apiHandler((req: NextRequest, { params }: RouteContext) =>
  blogController.getById(req, { params: { id: params.id } })
);

// Only Admins and Super Admins can update a blog post
export const PUT = apiHandler((req: NextRequest, { params }: RouteContext) =>
  blogController.update(req, { params: { id: params.id } })
, ['Admin', 'SAdmin']);


// Only Admins and Super Admins can delete a blog post
export const DELETE = apiHandler((req: NextRequest, { params }: RouteContext) =>
  blogController.delete(req, { params: { id: params.id } })
, ['Admin', 'SAdmin']);
