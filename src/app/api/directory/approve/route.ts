// src/app/api/directory/approve/route.ts
import { DirectoryController } from '@/lib/directory/infrastructure/api/directory.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const directoryController = new DirectoryController();

// Only Admins and Super Admins can approve a business verification request
export const POST = apiHandler((req) => 
  directoryController.approveVerification(req)
, ['Admin', 'SAdmin']);
