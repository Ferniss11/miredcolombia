// src/lib/platform/api/base.controller.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Defines the basic structure for all API controllers.
 * While it's empty for now, it establishes a pattern and can be
 * extended with common methods (e.g., handleAuth, validateRequest) in the future.
 */
export interface BaseController {
    // Methods like 'create', 'getById', 'update', 'delete' will be defined in the concrete controller classes.
}
