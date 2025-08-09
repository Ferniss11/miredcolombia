// src/app/api/jobs/[jobId]/apply/route.ts
import { JobApplicationController } from '@/lib/job-application/infrastructure/api/job-application.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const jobApplicationController = new JobApplicationController();

type RouteContext = { params: { jobId: string } };

// This endpoint should be protected so only authenticated users can apply
export const POST = apiHandler((req: NextRequest, { params }: RouteContext) =>
  jobApplicationController.apply(req, { params: { jobId: params.jobId } })
, ['User', 'Admin', 'SAdmin', 'Advertiser']); // Allow all authenticated roles for now
