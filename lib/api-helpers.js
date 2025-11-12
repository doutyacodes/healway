// FILE: lib/api-helpers.js
import { getAuthUser, verifyToken } from './auth';
import { NextResponse } from 'next/server';

/**
 * Wrapper for protected API routes
 * Automatically checks authentication and passes user data
 * Supports both cookie-based (web) and token-based (mobile) authentication
 */
export function withAuth(handler, options = {}) {
  return async (request, context) => {
    let user = null;

    // Try token-based auth first (for mobile API)
    const authHeader = request.headers.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      try {
        user = await verifyToken(token);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
    } else {
      // Fall back to cookie-based auth (for web)
      user = await getAuthUser(request);
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    // Check user type if specified
    if (options.allowedTypes && !options.allowedTypes.includes(user.type)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Insufficient permissions.' },
        { status: 403 }
      );
    }

    // Pass user data to handler
    return handler(request, context, user);
  };
}

/**
 * Wrapper specifically for mobile API routes (token-only)
 * Use this for routes under /api/mobile-api/
 */
export function withMobileAuth(handler, options = {}) {
  return async (request, context) => {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let user;
    try {
      user = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check if user type is allowed
    if (options.allowedTypes && !options.allowedTypes.includes(user.type)) {
      return NextResponse.json(
        { success: false, error: "Access denied - insufficient permissions" },
        { status: 403 }
      );
    }

    // Call the original handler with decoded user info
    return await handler(request, context, user);
  };
}

/**
 * Example usage in web API route:
 * export const GET = withAuth(async (request, context, user) => {
 *   // Supports both cookie and token auth
 *   return NextResponse.json({ user });
 * }, { allowedTypes: ['superadmin', 'admin'] });
 * 
 * Example usage in mobile API route:
 * export const GET = withMobileAuth(async (request, context, user) => {
 *   // Token-only authentication
 *   return NextResponse.json({ user });
 * }, { allowedTypes: ['security'] });
 */