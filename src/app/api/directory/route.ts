// src/app/api/directory/route.ts
import { DirectoryController } from '@/lib/directory/infrastructure/api/directory.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const directoryController = new DirectoryController();

// Only Admins and Super Admins can add new businesses to the directory
export const POST = apiHandler((req) => 
  directoryController.add(req)
, ['Admin', 'SAdmin']);
