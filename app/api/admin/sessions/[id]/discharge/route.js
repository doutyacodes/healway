// FILE: app/api/admin/sessions/[id]/discharge/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { patientSessions, rooms, hospitalWings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// PATCH discharge patient (end session)
export const PATCH = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
                  const { id } = await context.params;

      const sessionId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Get session details
      const [session] = await db
        .select({
          id: patientSessions.id,
          userId: patientSessions.userId,
          roomId: patientSessions.roomId,
          wingId: patientSessions.wingId,
          status: patientSessions.status,
          hospitalId: patientSessions.hospitalId,
        })
        .from(patientSessions)
        .where(eq(patientSessions.id, sessionId))
        .limit(1);

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Session not found" },
          { status: 404 }
        );
      }

      // Verify session belongs to admin's hospital
      if (session.hospitalId !== user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      // Check if already discharged
      if (session.status !== "active") {
        return NextResponse.json(
          { success: false, error: "Session is not active" },
          { status: 400 }
        );
      }

      // Update session
      await db
        .update(patientSessions)
        .set({
          status: "discharged",
          endDate: new Date(),
          dischargedByAdminId: user.id,
          updatedAt: new Date(),
        })
        .where(eq(patientSessions.id, sessionId));

      // Update room status to available
      await db
        .update(rooms)
        .set({
          status: "available",
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, session.roomId));

      return NextResponse.json({
        success: true,
        message: "Patient discharged successfully",
      });
    } catch (error) {
      console.error("Error discharging patient:", error);
      return NextResponse.json(
        { success: false, error: "Failed to discharge patient" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);