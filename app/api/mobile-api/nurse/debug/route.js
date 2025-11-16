// FILE: app/api/mobile-api/nurse/debug/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  nurses,
  nursingSections,
  nursingSectionRooms,
  rooms,
  patientSessions,
  nursePatientAssignments,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET debug info for nurse
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const db = await getDb();

      // Get nurse details
      const [nurseDetails] = await db
        .select({
          nurseId: nurses.id,
          nurseName: nurses.name,
          nurseEmail: nurses.email,
          sectionId: nurses.sectionId,
          sectionName: nursingSections.sectionName,
          hospitalId: nurses.hospitalId,
        })
        .from(nurses)
        .leftJoin(nursingSections, eq(nurses.sectionId, nursingSections.id))
        .where(eq(nurses.id, nurse.id))
        .limit(1);

      // Get section rooms
      const sectionRooms = await db
        .select({
          assignmentId: nursingSectionRooms.id,
          roomId: nursingSectionRooms.roomId,
          roomNumber: rooms.roomNumber,
          roomType: rooms.roomType,
          isActive: rooms.isActive,
        })
        .from(nursingSectionRooms)
        .leftJoin(rooms, eq(nursingSectionRooms.roomId, rooms.id))
        .where(eq(nursingSectionRooms.sectionId, nurse.sectionId));

      // Get active sessions in those rooms
      const activeSessions = await db
        .select({
          sessionId: patientSessions.id,
          roomId: patientSessions.roomId,
          status: patientSessions.status,
        })
        .from(patientSessions)
        .where(
          and(
            eq(patientSessions.status, "active"),
            isNull(patientSessions.endDate)
          )
        );

      // Get direct patient assignments
      const patientAssignments = await db
        .select({
          assignmentId: nursePatientAssignments.id,
          sessionId: nursePatientAssignments.sessionId,
          isActive: nursePatientAssignments.isActive,
          assignedAt: nursePatientAssignments.assignedAt,
        })
        .from(nursePatientAssignments)
        .where(eq(nursePatientAssignments.nurseId, nurse.id));

      return NextResponse.json({
        success: true,
        debug: {
          nurse: nurseDetails,
          sectionRooms: {
            count: sectionRooms.length,
            rooms: sectionRooms,
          },
          activeSessions: {
            count: activeSessions.length,
            sessions: activeSessions,
          },
          patientAssignments: {
            count: patientAssignments.length,
            assignments: patientAssignments,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching debug info:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch debug info", details: error.message },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["nurse"] }
);