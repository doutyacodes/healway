// ============================================
// FILE: middleware.js
// DESCRIPTION: Global middleware for route protection and RBAC
// ============================================

import { NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ✅ Public routes (no authentication required)
  const publicRoutes = [
    "/login",
    "/api/hospital-login",
    "/api/auth/send-otp",
    "/api/auth/verify-otp",
  ];

  // ✅ Allow all mobile API routes (for mobile app usage)
  if (
    pathname.startsWith("/api/mobile-api/") ||
    publicRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // 🔒 Get authentication token from cookies
  const token = request.cookies.get("healway-auth-token")?.value;

  // ❌ If token is missing → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // ✅ Verify and decode the token
    const user = await verifyToken(token);

    // 🧠 Role-based Access Control (RBAC)
    // Restrict access to dashboards or sections by user type/role
    if (pathname.startsWith("/admin") && user.type !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/user") && !["patient", "bystander"].includes(user.role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/nurse") && user.type !== "nurse") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (pathname.startsWith("/security") && user.type !== "security") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // 📨 Forward user info for serverless API routes
    const headers = new Headers(request.headers);
    headers.set("x-user-id", user.id.toString());
    headers.set("x-user-type", user.type);
    if (user.role) headers.set("x-user-role", user.role);
    if (user.hospitalId) headers.set("x-hospital-id", user.hospitalId.toString());

    // ✅ Allow the request to continue
    return NextResponse.next({
      request: {
        headers,
      },
    });
  } catch (error) {
    console.error("🔴 Middleware auth error:", error);

    // ❌ Invalid token: clear cookie + redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("healway-auth-token");
    return response;
  }
}

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - image files in /public
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
