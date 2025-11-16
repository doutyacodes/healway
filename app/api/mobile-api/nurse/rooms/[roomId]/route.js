// FILE: app/api/mobile-api/nurse/rooms/[roomId]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  rooms,
  patientSessions,
  users,
  guests,
  guestLogs,
  hospitalWings,
  nursingSectionRooms,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET detailed room information with all guests
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const roomId = parseInt(context.params.roomId);
      const db = await getDb();

      // Verify nurse has access to this room
      const [roomAccess] = await db
        .select()
        .from(nursingSectionRooms)
        .where(
          and(
            eq(nursingSectionRooms.roomId, roomId),
            eq(nursingSectionRooms.sectionId, nurse.sectionId)
          )
        )
        .limit(1);

      if (!roomAccess) {
        return NextResponse.json(
          { success: false, error: "Access denied to this room" },
          { status: 403 }
        );
      }

      // Get room details with active session
      const [roomDetails] = await db
        .select({
          roomId: rooms.id,
          roomNumber: rooms.roomNumber,
          roomType: rooms.roomType,
          
          wingId: hospitalWings.id,
          wingName: hospitalWings.wingName,
          
          sessionId: patientSessions.id,
          sessionStatus: patientSessions.status,
          sessionStartDate: patientSessions.startDate,
          sessionEndDate: patientSessions.endDate,
          
          patientId: users.id,
          patientName: users.name,
          patientMobile: users.mobileNumber,
          patientRole: users.role,
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
        .where(eq(rooms.id, roomId))
        .limit(1);

      if (!roomDetails) {
        return NextResponse.json(
          { success: false, error: "Room not found" },
          { status: 404 }
        );
      }

      if (!roomDetails.sessionId) {
        return NextResponse.json({
          success: true,
          room: roomDetails,
          guests: [],
          guestLogs: [],
          message: "No active session in this room",
        });
      }

      // Get all guests for this session
      const allGuests = await db
        .select({
          guestId: guests.id,
          guestName: guests.guestName,
          guestPhone: guests.guestPhone,
          guestType: guests.guestType,
          relationshipToPatient: guests.relationshipToPatient,
          status: guests.status,
          validFrom: guests.validFrom,
          validUntil: guests.validUntil,
          qrCode: guests.qrCode,
          purpose: guests.purpose,
          isActive: guests.isActive,
        })
        .from(guests)
        .where(eq(guests.sessionId, roomDetails.sessionId))
        .orderBy(desc(guests.createdAt));

      // Get guest logs (visit history)
      const guestVisitLogs = await db
        .select({
          logId: guestLogs.id,
          guestId: guestLogs.guestId,
          guestName: guests.guestName,
          entryTime: guestLogs.entryTime,
          exitTime: guestLogs.exitTime,
          currentlyInside: guestLogs.currentlyInside,
          accessGranted: guestLogs.accessGranted,
          accessDeniedReason: guestLogs.accessDeniedReason,
          notes: guestLogs.notes,
        })
        .from(guestLogs)
        .leftJoin(guests, eq(guestLogs.guestId, guests.id))
        .where(eq(guestLogs.sessionId, roomDetails.sessionId))
        .orderBy(desc(guestLogs.entryTime))
        .limit(20);

      // Separate guests by status
      const activeGuests = allGuests.filter(
        g => g.status === "approved" && g.isActive
      );
      const guestsInside = guestVisitLogs.filter(
        log => log.currentlyInside
      );

      return NextResponse.json({
        success: true,
        room: roomDetails,
        guests: {
          all: allGuests,
          active: activeGuests,
          inside: guestsInside,
          total: allGuests.length,
          activeCount: activeGuests.length,
          insideCount: guestsInside.length,
        },
        visitLogs: guestVisitLogs,
      });
    } catch (error) {
      console.error("Error fetching room details:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch room details" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["nurse"] }
);