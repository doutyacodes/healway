// FILE: app/api/auth/verify-otp/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, otpVerifications } from "@/lib/db/schema";
import { eq, and, isNull, gt, desc } from "drizzle-orm";
import { verifyOTP, generateToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobileNumber, otp } = body;

    if (!mobileNumber || !otp) {
      return NextResponse.json(
        { success: false, error: "Mobile number and OTP are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Find the most recent unverified OTP for this mobile number
    const [storedOTP] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.mobileNumber, mobileNumber),
          eq(otpVerifications.verified, false),
          gt(otpVerifications.expiresAt, new Date())
        )
      )
      .orderBy(desc(otpVerifications.createdAt))
      .limit(1);

    if (!storedOTP) {
      return NextResponse.json(
        {
          success: false,
          error: "OTP not found or expired. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    // Check attempt count (max 5 attempts)
    if (storedOTP.attemptCount >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many incorrect attempts. Please request a new OTP.",
        },
        { status: 429 }
      );
    }

    console.log("Stored OTP:", storedOTP);
    console.log("Stored OTP2 :", otp);
    // Verify OTP
    const isValid = String(otp).trim() === String(storedOTP?.otp);

    if (!isValid) {
      // Increment attempt count
      await db
        .update(otpVerifications)
        .set({
          attemptCount: storedOTP.attemptCount + 1,
        })
        .where(eq(otpVerifications.id, storedOTP.id));

      return NextResponse.json(
        {
          success: false,
          error: `Invalid OTP. ${
            5 - storedOTP.attemptCount - 1
          } attempts remaining.`,
        },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await db
      .update(otpVerifications)
      .set({
        verified: true,
      })
      .where(eq(otpVerifications.id, storedOTP.id));

    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.mobileNumber, mobileNumber),
          eq(users.otpLoginEnabled, true),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Generate JWT token using jose
    const token = await generateToken({
      id: user.id,
      type: "user",
      role: user.role,
      hospitalId: user.hospitalId,
      email: user.email,
      name: user.name,
    });

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
      redirectTo: "/user/dashboard",
    });

    // Set HTTP-only cookie
    response.cookies.set("healway-auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify OTP. Please try again." },
      { status: 500 }
    );
  }
}
