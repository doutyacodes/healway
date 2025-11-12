// FILE: app/api/auth/verify-otp/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { verifyOTP, generateToken } from "@/lib/auth";

// In-memory OTP store (shared with send-otp)
// ⚠️ Use Redis in production for scalability
const otpStore = new Map();

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobileNumber, otp } = body;

    console.log("Verifying OTP for:", mobileNumber, otp);
    if (!mobileNumber || !otp) {
      return NextResponse.json(
        { success: false, error: "Mobile number and OTP are required" },
        { status: 400 }
      );
    }
    console.log("Verifying OTP for:", mobileNumber, otp);

    // Check if OTP exists
    const storedData = otpStore.get(mobileNumber);

    if (!storedData) {
      return NextResponse.json(
        { success: false, error: "OTP not found or expired. Please request a new OTP." },
        { status: 400 }
      );
    }
    console.log("Verifying OTP for:", mobileNumber, otp);

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(mobileNumber);
      return NextResponse.json(
        { success: false, error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }
    console.log("Verifying OTP for:", mobileNumber, otp);

    // Verify OTP
    const isValid = await verifyOTP(otp, storedData.otp);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP. Please check and try again." },
        { status: 400 }
      );
    }

    // Get user details
    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, storedData.userId),
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

    // Clear OTP from store
    otpStore.delete(mobileNumber);

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

// Export the OTP store to share with send-otp
export { otpStore };