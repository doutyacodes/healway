// ============================================
// FILE: app/api/hospital-login/route.js
// HEALWAY LOGIN API – Super Admin & Hospital Admin
// ============================================

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db"; // using your db/index.js
import { superAdmins, hospitalAdmins } from "@/lib/db/schema"; // correct tables
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth"; // same JWT utility as before

export async function POST(request) {
  try {
    const db = await getDb();
    const { email, password, userType } = await request.json();

    // Validation
    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: "Email, password, and user type are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    let userData = null;

    // ============================================
    // SUPER ADMIN LOGIN
    // ============================================
    if (userType === "superadmin") {
      const [superAdmin] = await db
        .select()
        .from(superAdmins)
        .where(eq(superAdmins.email, email))
        .limit(1);

      if (!superAdmin) {
        return NextResponse.json(
          { error: "Invalid credentials." },
          { status: 401 }
        );
      }

      const valid = await bcrypt.compare(password, superAdmin.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid credentials." },
          { status: 401 }
        );
      }

      userData = {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        type: "superadmin",
      };
    }

    // ============================================
    // HOSPITAL ADMIN LOGIN
    // ============================================
    else if (userType === "admin") {
      const [admin] = await db
        .select()
        .from(hospitalAdmins)
        .where(eq(hospitalAdmins.email, email))
        .limit(1);

      if (!admin) {
        return NextResponse.json(
          { error: "Invalid credentials." },
          { status: 401 }
        );
      }

      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid credentials." },
          { status: 401 }
        );
      }

      userData = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        mobileNumber: admin.mobileNumber,
        hospitalId: admin.hospitalId,
        role: admin.role,
        type: "admin",
      };
    }

    // ============================================
    // INVALID TYPE
    // ============================================
    else {
      return NextResponse.json(
        { error: 'Invalid user type. Must be "superadmin" or "admin".' },
        { status: 400 }
      );
    }

    // ============================================
    // GENERATE JWT TOKEN
    // ============================================
    const token = await signToken(userData);

    const response = NextResponse.json({
      success: true,
      user: userData,
      message: "Login successful.",
    });

    // Auth Token Cookie
    response.cookies.set({
      name: "healway-auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Role Cookie (optional for client-side access)
    response.cookies.set("healway-user-role", userData.type, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("❌ Healway Login Error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
