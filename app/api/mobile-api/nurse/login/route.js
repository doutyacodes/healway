// FILE: app/api/mobile-api/nurse/login/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nurses, deviceTokens } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, device_token, platform, device_model } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Find nurse by email
    const [nurse] = await db
      .select()
      .from(nurses)
      .where(and(eq(nurses.email, email), isNull(nurses.deletedAt)))
      .limit(1);

    if (!nurse) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!nurse.isActive) {
      return NextResponse.json(
        { success: false, error: "Account is inactive. Please contact admin." },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, nurse.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await generateToken({
      id: nurse.id,
      type: "nurse",
      hospitalId: nurse.hospitalId,
      sectionId: nurse.sectionId,
      email: nurse.email,
      name: nurse.name,
    });

    // ⭐ Save device token if provided
    if (device_token) {
      // Check if this token already exists
      const existingToken = await db
        .select()
        .from(deviceTokens)
        .where(eq(deviceTokens.deviceToken, device_token))
        .limit(1);

      if (existingToken.length === 0) {
        // Insert new token
        await db.insert(deviceTokens).values({
          userId: nurse.id,
          deviceToken: device_token,
          platform: platform || null,
          deviceModel: device_model || null,
        });
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      nurse: {
        id: nurse.id,
        name: nurse.name,
        email: nurse.email,
        mobileNumber: nurse.mobileNumber,
        hospitalId: nurse.hospitalId,
        sectionId: nurse.sectionId,
        shiftTiming: nurse.shiftTiming,
        employeeId: nurse.employeeId,
      },
    });
  } catch (error) {
    console.error("Error during nurse login:", error);
    return NextResponse.json(
      { success: false, error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
