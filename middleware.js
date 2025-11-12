// FILE: middleware.js (root directory)
import { NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicRoutes = [
    "/login",
    "/api/hospital-login",
    "/api/auth/send-otp",
    "/api/auth/verify-otp",
  ];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get("healway-auth-token")?.value;

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verify token
    const user = await verifyToken(token);

    // Role-based access control
    if (pathname.startsWith("/admin")) {
      if (user.type !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    if (pathname.startsWith("/user")) {
      if (!["patient", "bystander"].includes(user.role)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    if (pathname.startsWith("/nurse")) {
      if (user.type !== "nurse") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    if (pathname.startsWith("/security")) {
      if (user.type !== "security") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.id.toString());
    requestHeaders.set("x-user-type", user.type);
    
    if (user.role) {
      requestHeaders.set("x-user-role", user.role);
    }
    
    if (user.hospitalId) {
      requestHeaders.set("x-hospital-id", user.hospitalId.toString());
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Middleware auth error:", error);
    // Invalid token - clear cookie and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("healway-auth-token");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};