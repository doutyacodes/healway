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
  nursingSections,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET detailed room information with all guests
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const { roomId } = await context.params ?? {};

      const parsedRoomId = Number(roomId);

      if (!Number.isInteger(parsedRoomId)) {
        return NextResponse.json(
          { success: false, error: "Invalid roomId" },
          { status: 400 }
        );
      }

      const db = await getDb();

      // ✅ FIXED: Verify nurse has access to this room in THEIR hospital
      const [roomAccess] = await db
        .select({
          roomId: nursingSectionRooms.roomId,
          sectionId: nursingSectionRooms.sectionId,
          wingId: rooms.wingId,
          wingHospitalId: hospitalWings.hospitalId,
        })
        .from(nursingSectionRooms)
        .innerJoin(rooms, eq(nursingSectionRooms.roomId, rooms.id))
        .innerJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
        .where(
          and(
            eq(nursingSectionRooms.roomId, parsedRoomId),
            eq(nursingSectionRooms.sectionId, nurse.sectionId),
            eq(hospitalWings.hospitalId, nurse.hospitalId) // ✅ Hospital validation
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
        .innerJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
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
            eq(rooms.id, parsedRoomId),
            eq(hospitalWings.hospitalId, nurse.hospitalId) // ✅ Double-check hospital
          )
        )
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

      // Get all guests for this session (with hospital validation)
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
        .where(
          and(
            eq(guests.sessionId, roomDetails.sessionId),
            eq(guests.hospitalId, nurse.hospitalId) // ✅ Ensure guests are from nurse's hospital
          )
        )
        .orderBy(desc(guests.createdAt));

      // Get guest logs (visit history) with hospital validation
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
        .innerJoin(guests, eq(guestLogs.guestId, guests.id))
        .where(
          and(
            eq(guestLogs.sessionId, roomDetails.sessionId),
            eq(guests.hospitalId, nurse.hospitalId) // ✅ Ensure logs are from nurse's hospital
          )
        )
        .orderBy(desc(guestLogs.entryTime))
        .limit(20);

      // Separate guests by status
      const activeGuests = allGuests.filter(
        (g) => g.status === "approved" && g.isActive
      );
      const guestsInside = guestVisitLogs.filter((log) => log.currentlyInside);

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