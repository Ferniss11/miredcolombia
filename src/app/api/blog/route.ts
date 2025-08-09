// src/app/api/blog/route.ts
import { BlogController } from '@/lib/blog/infrastructure/api/blog.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const blogController = new BlogController();

// Only Admins and Super Admins can add new blog posts
export const POST = apiHandler((req) => 
  blogController.create(req)
, ['Admin', 'SAdmin']);

// This endpoint is public for anyone to get all blog posts
export const GET = apiHandler((req: NextRequest) =>
  blogController.getAll(req)
);
