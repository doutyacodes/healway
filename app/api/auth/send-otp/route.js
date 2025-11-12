// FILE: app/api/auth/send-otp/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { generateOTP, hashOTP } from "@/lib/auth";

// Import the shared OTP store
import { storeOTP } from "@/lib/otp-store";

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
          error:
            "No user found with this mobile number or OTP login not enabled",
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

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    // Store OTP with expiry (5 minutes)
    storeOTP(mobileNumber, {
      otp: hashedOTP,
      userId: user.id,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
    // await sendSMS(mobileNumber, `Your HealWay OTP is: ${otp}`);

    console.log(`🔐 OTP for ${mobileNumber}: ${otp}`);
    console.log(`📱 User: ${user.name} (${user.role})`);
    console.log(`⏰ Expires in 5 minutes`);

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
