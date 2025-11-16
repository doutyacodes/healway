// FILE: app/api/mobile-api/nurse/rooms/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  rooms,
  nursingSectionRooms,
  patientSessions,
  users,
  hospitalWings,
  nursePatientAssignments,
} from "@/lib/db/schema";
import { eq, and, isNull, or, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all rooms nurse has access to
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const { searchParams } = new URL(request.url);
      const filter = searchParams.get("filter"); // 'all', 'with-session', 'with-guests', 'assigned-to-me'

      const db = await getDb();

      // Get rooms in nurse's section
      const sectionRoomIds = await db
        .select({ roomId: nursingSectionRooms.roomId })
        .from(nursingSectionRooms)
        .where(eq(nursingSectionRooms.sectionId, nurse.sectionId));

      const roomIds = sectionRoomIds.map(r => r.roomId);

      if (roomIds.length === 0) {
        return NextResponse.json({
          success: true,
          rooms: [],
          count: 0,
          message: "No rooms in your section yet",
        });
      }

      // Get all rooms with session info
      const allRooms = await db
        .select({
          roomId: rooms.id,
          roomNumber: rooms.roomNumber,
          roomType: rooms.roomType,
          roomStatus: rooms.status,
          
          wingId: hospitalWings.id,
          wingName: hospitalWings.wingName,
          
          sessionId: patientSessions.id,
          sessionStatus: patientSessions.status,
          
          patientId: users.id,
          patientName: users.name,
          patientMobile: users.mobileNumber,
        })
        .from(rooms)
        .leftJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
        .leftJoin(
          patientSessions,
          and(
            eq(patientSessions.roomId, rooms.id),
            eq(patientSessions.status, "active")
          )
        )
        .leftJoin(users, eq(patientSessions.userId, users.id))
        .where(
          and(
            sql`${rooms.id} IN (${sql.join(roomIds, sql`, `)})`,
            eq(rooms.isActive, true),
            isNull(rooms.deletedAt)
          )
        );

      // Check which patients are assigned to this nurse
      if (filter === "assigned-to-me") {
        const assignedSessionIds = await db
          .select({ sessionId: nursePatientAssignments.sessionId })
          .from(nursePatientAssignments)
          .where(
            and(
              eq(nursePatientAssignments.nurseId, nurse.id),
              eq(nursePatientAssignments.isActive, true)
            )
          );

        const assignedIds = assignedSessionIds.map(s => s.sessionId);
        const filteredRooms = allRooms.filter(room => 
          room.sessionId && assignedIds.includes(room.sessionId)
        );

        return NextResponse.json({
          success: true,
          rooms: filteredRooms,
          count: filteredRooms.length,
        });
      }

      // Apply other filters
      let filteredRooms = allRooms;
      
      if (filter === "with-session") {
        filteredRooms = allRooms.filter(room => room.sessionId);
      }

      return NextResponse.json({
        success: true,
        rooms: filteredRooms,
        count: filteredRooms.length,
        totalRooms: allRooms.length,
      });
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch rooms" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["nurse"] }
);