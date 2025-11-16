// FILE: app/api/admin/patient-sessions/[sessionId]/assign-nurse/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  nursePatientAssignments,
  patientSessions,
  nurses,
  nursingSectionRooms,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// POST assign nurse to patient session
export const POST = withAuth(
  async (request, context, user) => {
    try {
      const {sessionId} = await context.params;
      const body = await request.json();
      const { nurseId } = body;

      if (!nurseId) {
        return NextResponse.json(
          { success: false, error: "Nurse ID is required" },
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

      // Verify nurse exists and belongs to hospital
      const [nurse] = await db
        .select()
        .from(nurses)
        .where(
          and(
            eq(nurses.id, nurseId),
            eq(nurses.hospitalId, user.hospitalId),
            eq(nurses.isActive, true),
            isNull(nurses.deletedAt)
          )
        )
        .limit(1);

      if (!nurse) {
        return NextResponse.json(
          { success: false, error: "Nurse not found or inactive" },
          { status: 404 }
        );
      }

      // Check if nurse's section has access to this room
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
            error: "Nurse's section does not have access to this room",
          },
          { status: 403 }
        );
      }

      // Check if nurse is already assigned to this session
      const [existingAssignment] = await db
        .select()
        .from(nursePatientAssignments)
        .where(
          and(
            eq(nursePatientAssignments.nurseId, nurseId),
            eq(nursePatientAssignments.sessionId, sessionId),
            eq(nursePatientAssignments.isActive, true)
          )
        )
        .limit(1);

      if (existingAssignment) {
        return NextResponse.json(
          { success: false, error: "Nurse is already assigned to this patient" },
          { status: 400 }
        );
      }

      // Create assignment
      await db.insert(nursePatientAssignments).values({
        nurseId,
        sessionId,
        assignedByAdminId: user.id,
        isActive: true,
      });

      return NextResponse.json({
        success: true,
        message: "Nurse assigned to patient successfully",
      });
    } catch (error) {
      console.error("Error assigning nurse:", error);
      return NextResponse.json(
        { success: false, error: "Failed to assign nurse to patient" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);