// FILE: app/api/admin/patient-sessions/[sessionId]/unassign-nurse/[nurseId]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nursePatientAssignments, patientSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// DELETE unassign nurse from patient session
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
      const { sessionId, nurseId } = await context.params;

      const parsedSessionId = Number(sessionId);
      const parsedNurseId = Number(nurseId);

      if (
        Number.isNaN(parsedSessionId) ||
        Number.isNaN(parsedNurseId)
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid sessionId or nurseId" },
          { status: 400 }
        );
      }

      const db = await getDb();

      const [session] = await db
        .select()
        .from(patientSessions)
        .where(
          and(
            eq(patientSessions.id, parsedSessionId),
            eq(patientSessions.hospitalId, user.hospitalId)
          )
        )
        .limit(1);

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Patient session not found" },
          { status: 404 }
        );
      }

      await db
        .update(nursePatientAssignments)
        .set({
          isActive: false,
          unassignedAt: new Date(),
        })
        .where(
          and(
            eq(nursePatientAssignments.nurseId, parsedNurseId),
            eq(nursePatientAssignments.sessionId, parsedSessionId),
            eq(nursePatientAssignments.isActive, true)
          )
        );

      return NextResponse.json({
        success: true,
        message: "Nurse unassigned from patient successfully",
      });
    } catch (error) {
      console.error("Error unassigning nurse:", error);
      return NextResponse.json(
        { success: false, error: "Failed to unassign nurse from patient" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);
