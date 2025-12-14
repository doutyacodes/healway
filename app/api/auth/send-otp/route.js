                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          // FILE: app/api/auth/send-otp/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, otpVerifications } from "@/lib/db/schema";
import { eq, and, isNull, lt } from "drizzle-orm";
import { generateOTP, hashOTP } from "@/lib/auth";
export async function POST(request) {
  try {
    const body = await request.json();
    const { mobileNumber } = body;
    if (!mobileNumber) {
      return NextResponse.json(
        { success: false, error: "Mobile number is required" },
        { status: 400 }
      );
    }
    const db = await getDb();
    // Find user by mobile number
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
        {
          success: false,
          error: "No user found with this mobile number or OTP login not enabled",
        },
        { status: 404 }
      );
    }
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "User account is inactive. Please contact support.",
        },
        { status: 403 }
      );
    }
    // Clean up old expired OTPs for this mobile number
    await db
      .delete(otpVerifications)
      .where(
        and(
          eq(otpVerifications.mobileNumber, mobileNumber),
          lt(otpVerifications.expiresAt, new Date())
        )
      );
    // Check for recent OTP attempts (rate limiting)
    const recentOTP = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.mobileNumber, mobileNumber),
          eq(otpVerifications.verified, false)
        )
      )
      .orderBy(otpVerifications.createdAt)
      .limit(1);
    if (recentOTP.length > 0) {
      const timeSinceLastOTP = Date.now() - new Date(recentOTP[0].createdAt).getTime();
      const cooldownPeriod = 60 * 1000; // 1 minute
      if (timeSinceLastOTP < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastOTP) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
          },
          { status: 429 }
        );
      }
    }
    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);
    // Get IP address
    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown";
    // Store OTP in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await db.insert(otpVerifications).values({
      mobileNumber,
      otp: otp,
      expiresAt,
      verified: false,
      attemptCount: 0,
      ipAddress,
    });
    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
    // await sendSMS(mobileNumber, `Your HealWay OTP is: ${otp}`);
    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // ⚠️ TESTING ONLY - Remove in production
      ...(process.env.NODE_ENV === "development" && { otp }),
      expiresIn: 300, // 5 minutes in seconds
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}