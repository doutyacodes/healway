// FILE: middleware.js
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

  // ✅ Allow all mobile-api routes (for mobile app)
  if (
    pathname.startsWith("/api/mobile-api/") ||
    publicRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // 🔒 Check for auth token for protected routes
  const token = request.cookies.get("healway-auth-token")?.value;

  if (!token) {
    // Redirect unauthenticated requests to /login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // ✅ Verify token validity
    const user = await verifyToken(token);

    // 🧠 Role-based access control
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

    // 📨 Add user info to headers for downstream APIs
    const headers = new Headers(request.headers);
    headers.set("x-user-id", user.id.toString());
    headers.set("x-user-type", user.type);
    if (user.role) headers.set("x-user-role", user.role);
    if (user.hospitalId) headers.set("x-hospital-id", user.hospitalId.toString());

    return NextResponse.next({ request: { headers } });
  } catch (error) {
    console.error("Middleware auth error:", error);
    // ❌ Invalid token: clear cookie and redirect
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("healway-auth-token");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - and static image files in public directory
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
