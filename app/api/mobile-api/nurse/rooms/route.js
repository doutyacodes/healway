// FILE: app/api/mobile-api/nurse/rooms/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  rooms,
  nursingSectionRooms,
  patientSessions,
  users,
  hospitalWings,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all rooms in nurse's section
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const { searchParams } = new URL(request.url);
      const filter = searchParams.get("filter"); // 'all', 'with-session', 'with-guests'

      const db = await getDb();

      // Get all rooms in nurse's section
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
        .from(nursingSectionRooms)
        .innerJoin(rooms, eq(nursingSectionRooms.roomId, rooms.id))
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
            eq(nursingSectionRooms.sectionId, nurse.sectionId),
            eq(rooms.isActive, true),
            isNull(rooms.deletedAt)
          )
        );

      // Apply filters
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