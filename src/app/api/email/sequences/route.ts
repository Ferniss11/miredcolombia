// src/app/api/email/sequences/route.ts
import { apiHandler } from '@/lib/platform/api/api-handler';
import { EmailSequenceController } from '@/lib/email-sequence/infrastructure/api/email-sequence.controller';
import { NextRequest } from 'next/server';

const controller = new EmailSequenceController();

// Only Admins can manage sequences
const adminRoles = ['Admin', 'SAdmin'];

export const POST = apiHandler((req) => 
  controller.create(req)
, adminRoles);

export const GET = apiHandler(() =>
  controller.getAll()
, adminRoles);
