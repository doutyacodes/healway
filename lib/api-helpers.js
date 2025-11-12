// FILE: lib/api-helpers.js
import { getAuthUser } from './auth';
import { NextResponse } from 'next/server';

/**
 * Wrapper for protected API routes
 * Automatically checks authentication and passes user data
 */
export function withAuth(handler, options = {}) {
  return async (request, context) => {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    // Check user type if specified
    if (options.allowedTypes && !options.allowedTypes.includes(user.type)) {
      return NextResponse.json(
        { error: 'Forbidden. Insufficient permissions.' },
        { status: 403 }
      );
    }

    // Pass user data to handler
    return handler(request, context, user);
  };
}

/**
 * Example usage in API route:
 * export const GET = withAuth(async (request, context, user) => {
 *   // user is automatically available here
 *   return NextResponse.json({ user });
 * }, { allowedTypes: ['superadmin', 'admin'] });
 */