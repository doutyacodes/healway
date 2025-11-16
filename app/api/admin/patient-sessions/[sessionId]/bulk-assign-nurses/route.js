// FILE: app/api/admin/patient-sessions/[sessionId]/bulk-assign-nurses/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  nursePatientAssignments,
  patientSessions,
  nurses,
  nursingSectionRooms,
} from "@/lib/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// POST bulk assign multiple nurses to a patient session
export const POST = withAuth(
  async (request, context, user) => {
    try {
      const {sessionId} = await context.params;
      const body = await request.json();
      const { nurseIds } = body;

      if (!Array.isArray(nurseIds) || nurseIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "Nurse IDs array is required" },
          { status: 400 }
        );
      }

      const db = await getDb();

      // Verify session exists and belongs to admin's hospital
      const [session] = await db
        .select()
        .from(patientSessions)
        .where(
          and(
            eq(patientSessions.id, sessionId),
            eq(patientSessions.hospitalId, user.hospitalId),
            eq(patientSessions.status, "active")
          )
        )
        .limit(1);

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Active patient session not found" },
          { status: 404 }
        );
      }

      // Get valid nurses
      const validNurses = await db
        .select({
          id: nurses.id,
          sectionId: nurses.sectionId,
        })
        .from(nurses)
        .where(
          and(
            inArray(nurses.id, nurseIds),
            eq(nurses.hospitalId, user.hospitalId),
            eq(nurses.isActive, true),
            isNull(nurses.deletedAt)
          )
        );

      if (validNurses.length !== nurseIds.length) {
        return NextResponse.json(
          { success: false, error: "Some nurses not found or inactive" },
          { status: 404 }
        );
      }

      // Check if all nurses have access to the room
      for (const nurse of validNurses) {
        const [roomAccess] = await db
          .select()
          .from(nursingSectionRooms)
          .where(
            and(
              eq(nursingSectionRooms.sectionId, nurse.sectionId),
              eq(nursingSectionRooms.roomId, session.roomId)
            )
          )
          .limit(1);

        if (!roomAccess) {
          return NextResponse.json(
            {
              success: false,
              error: `One or more nurses' sections do not have access to this room`,
            },
            { status: 403 }
          );
        }
      }

      // Get existing assignments
      const existingAssignments = await db
        .select()
        .from(nursePatientAssignments)
        .where(
          and(
            eq(nursePatientAssignments.sessionId, sessionId),
            inArray(nursePatientAssignments.nurseId, nurseIds),
            eq(nursePatientAssignments.isActive, true)
          )
        );

      const existingNurseIds = existingAssignments.map((a) => a.nurseId);
      const newNurseIds = nurseIds.filter((id) => !existingNurseIds.includes(id));

      // Bulk insert new assignments
      if (newNurseIds.length > 0) {
        const values = newNurseIds.map((nurseId) => ({
          nurseId,
          sessionId,
          assignedByAdminId: user.id,
          isActive: true,
        }));

        await db.insert(nursePatientAssignments).values(values);
      }

      return NextResponse.json({
        success: true,
        message: "Nurses assigned to patient successfully",
        stats: {
          total: nurseIds.length,
          newlyAssigned: newNurseIds.length,
          alreadyAssigned: existingNurseIds.length,
        },
      });
    } catch (error) {
      console.error("Error bulk assigning nurses:", error);
      return NextResponse.json(
        { success: false, error: "Failed to assign nurses to patient" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);