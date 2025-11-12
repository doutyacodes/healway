// FILE: app/api/user/visiting-hours/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { visitingHours, patientSessions, hospitalWings } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET visiting hours for user's current wing
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();

      // Get user's active session
      const [session] = await db
        .select()
        .from(patientSessions)
        .where(
          and(
            eq(patientSessions.userId, user.id),
            eq(patientSessions.status, "active")
          )
        )
        .limit(1);

      if (!session) {
        return NextResponse.json({
          success: true,
          visitingHours: [],
          message: "No active session",
        });
      }

      // Get visiting hours for this wing
      const hours = await db
        .select()
        .from(visitingHours)
        .where(
          and(
            eq(visitingHours.hospitalId, user.hospitalId),
            eq(visitingHours.wingId, session.wingId),
            eq(visitingHours.isActive, true)
          )
        )
        .orderBy(visitingHours.dayOfWeek, visitingHours.startTime);

      // If no wing-specific hours, get general hours (dayOfWeek = null)
      let finalHours = hours;
      if (hours.length === 0) {
        finalHours = await db
          .select()
          .from(visitingHours)
          .where(
            and(
              eq(visitingHours.hospitalId, user.hospitalId),
              isNull(visitingHours.dayOfWeek),
              eq(visitingHours.isActive, true)
            )
          )
          .orderBy(visitingHours.startTime);
      }

      return NextResponse.json({
        success: true,
        visitingHours: finalHours,
        count: finalHours.length,
      });
    } catch (error) {
      console.error("Error fetching visiting hours:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch visiting hours" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["user"] }
);