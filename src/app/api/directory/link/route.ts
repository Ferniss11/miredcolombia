// src/app/api/directory/link/route.ts
import { DirectoryController } from '@/lib/directory/infrastructure/api/directory.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const directoryController = new DirectoryController();

// Only authenticated advertisers can attempt to link a business to their profile
export const POST = apiHandler((req) => 
  directoryController.linkToUser(req)
, ['Advertiser']);
