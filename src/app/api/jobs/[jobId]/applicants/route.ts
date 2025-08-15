// src/app/api/jobs/[jobId]/applicants/route.ts
import { JobApplicationController } from '@/lib/job-application/infrastructure/api/job-application.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const jobApplicationController = new JobApplicationController();

type RouteContext = { params: { jobId: string } };

// This endpoint should be protected so only the job owner can see applicants
export const GET = apiHandler((req: NextRequest, { params }: RouteContext) =>
  jobApplicationController.getForJob(req, { params: { jobId: params.jobId } })
, ['Admin', 'SAdmin', 'Advertiser']);