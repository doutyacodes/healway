// FILE: app/api/admin/cleanup-otps/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { otpVerifications } from "@/lib/db/schema";
import { lt } from "drizzle-orm";

export async function POST(request) {
  try {
    const db = await getDb();

    // Delete OTPs older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await db
      .delete(otpVerifications)
      .where(lt(otpVerifications.expiresAt, oneHourAgo));

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      deletedCount: result.rowsAffected || 0,
    });
  } catch (error) {
    console.error("Error cleaning up OTPs:", error);
    return NextResponse.json(
      { success: false, error: "Cleanup failed" },
      { status: 500 }
    );
  }
}