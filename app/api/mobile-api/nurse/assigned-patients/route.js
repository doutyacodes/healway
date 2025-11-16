// FILE: app/api/mobile-api/nurse/assigned-patients/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  nursePatientAssignments,
  patientSessions,
  users,
  rooms,
  hospitalWings,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all patients assigned to this nurse
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const db = await getDb();

      // Get all active assignments for this nurse
      const assignedPatients = await db
        .select({
          assignmentId: nursePatientAssignments.id,
          sessionId: patientSessions.id,
          sessionStatus: patientSessions.status,
          sessionStartDate: patientSessions.startDate,
          admissionType: patientSessions.admissionType,
          
          patientId: users.id,
          patientName: users.name,
          patientMobile: users.mobileNumber,
          patientRole: users.role,
          
          roomId: rooms.id,
          roomNumber: rooms.roomNumber,
          roomType: rooms.roomType,
          
          wingId: hospitalWings.id,
          wingName: hospitalWings.wingName,
          
          assignedAt: nursePatientAssignments.assignedAt,
        })
        .from(nursePatientAssignments)
        .innerJoin(
          patientSessions,
          eq(nursePatientAssignments.sessionId, patientSessions.id)
        )
        .innerJoin(users, eq(patientSessions.userId, users.id))
        .innerJoin(rooms, eq(patientSessions.roomId, rooms.id))
        .innerJoin(hospitalWings, eq(patientSessions.wingId, hospitalWings.id))
        .where(
          and(
            eq(nursePatientAssignments.nurseId, nurse.id),
            eq(nursePatientAssignments.isActive, true),
            eq(patientSessions.status, "active")
          )
        )
        .orderBy(nursePatientAssignments.assignedAt);

      return NextResponse.json({
        success: true,
        patients: assignedPatients,
        count: assignedPatients.length,
      });
    } catch (error) {
      console.error("Error fetching assigned patients:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch assigned patients" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["nurse"] }
);