// FILE: app/api/admin/sessions/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  patientSessions,
  users,
  hospitalWings,
  rooms,
  hospitalAdmins,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET session details
export const GET = withAuth(
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

      const [session] = await db
        .select({
          id: patientSessions.id,
          startDate: patientSessions.startDate,
          endDate: patientSessions.endDate,
          admissionType: patientSessions.admissionType,
          status: patientSessions.status,
          notes: patientSessions.notes,
          // Patient info
          patientId: users.id,
          patientName: users.name,
          patientMobile: users.mobileNumber,
          patientEmail: users.email,
          patientRole: users.role,
          // Location info
          wingName: hospitalWings.wingName,
          roomNumber: rooms.roomNumber,
          roomType: rooms.roomType,
          // Admin info
          admittedByName: hospitalAdmins.name,
        })
        .from(patientSessions)
        .leftJoin(users, eq(patientSessions.userId, users.id))
        .leftJoin(hospitalWings, eq(patientSessions.wingId, hospitalWings.id))
        .leftJoin(rooms, eq(patientSessions.roomId, rooms.id))
        .leftJoin(
          hospitalAdmins,
          eq(patientSessions.admittedByAdminId, hospitalAdmins.id)
        )
        .where(eq(patientSessions.id, sessionId))
        .limit(1);

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Session not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        session,
      });
    } catch (error) {
      console.error("Error fetching session:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch session" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);