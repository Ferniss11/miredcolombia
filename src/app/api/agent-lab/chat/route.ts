
// src/app/api/agent-lab/chat/route.ts
import { AgentLabController } from '@/lib/chat/infrastructure/api/agent-lab.controller';
import { apiHandler } from '@/lib/platform/api/api-handler';
import { NextRequest } from 'next/server';

const controller = new AgentLabController();

// This endpoint is protected for admins only.
export const POST = apiHandler((req: NextRequest) =>
  controller.simulateChat(req)
, ['Admin', 'SAdmin']);
