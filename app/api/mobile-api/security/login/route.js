// FILE: app/api/mobile-api/security/login/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { securities } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Find security personnel by username
    const [security] = await db
      .select()
      .from(securities)
      .where(
        and(
          eq(securities.username, username),
          isNull(securities.deletedAt)
        )
      )
      .limit(1);

    if (!security) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!security.isActive) {
      return NextResponse.json(
        { success: false, error: "Account is inactive. Please contact admin." },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, security.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await generateToken({
      id: security.id,
      type: "security",
      hospitalId: security.hospitalId,
      assignedWingId: security.assignedWingId,
      username: security.username,
      name: security.name,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      security: {
        id: security.id,
        name: security.name,
        username: security.username,
        mobileNumber: security.mobileNumber,
        hospitalId: security.hospitalId,
        assignedWingId: security.assignedWingId,
        shiftTiming: security.shiftTiming,
        employeeId: security.employeeId,
        photoUrl: security.photoUrl,
      },
    });
  } catch (error) {
    console.error("Error during security login:", error);
    return NextResponse.json(
      { success: false, error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}