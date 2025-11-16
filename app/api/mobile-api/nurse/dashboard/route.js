// FILE: app/api/mobile-api/nurse/dashboard/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  rooms,
  patientSessions,
  users,
  guests,
  guestLogs,
  nursingSectionRooms,
  hospitalWings,
} from "@/lib/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET dashboard with rooms that have active guests
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const db = await getDb();
      const currentTime = new Date();

      // Get all rooms in nurse's section with active sessions
      const roomsWithSessions = await db
        .select({
          // Room info
          roomId: rooms.id,
          roomNumber: rooms.roomNumber,
          roomType: rooms.roomType,
          
          // Wing info
          wingId: hospitalWings.id,
          wingName: hospitalWings.wingName,
          
          // Session info
          sessionId: patientSessions.id,
          sessionStatus: patientSessions.status,
          sessionStartDate: patientSessions.startDate,
          
          // Patient info
          patientId: users.id,
          patientName: users.name,
          patientMobile: users.mobileNumber,
          patientRole: users.role,
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

      // For each room with active session, get guest information
      const roomsWithGuests = await Promise.all(
        roomsWithSessions
          .filter(room => room.sessionId) // Only rooms with active sessions
          .map(async (room) => {
            // Get all active guests for this session
            const activeGuests = await db
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
              })
              .from(guests)
              .where(
                and(
                  eq(guests.sessionId, room.sessionId),
                  eq(guests.status, "approved"),
                  eq(guests.isActive, true)
                )
              );

            // Get currently inside guests
            const guestsInside = await db
              .select({
                guestId: guestLogs.guestId,
                guestName: guests.guestName,
                entryTime: guestLogs.entryTime,
              })
              .from(guestLogs)
              .innerJoin(guests, eq(guestLogs.guestId, guests.id))
              .where(
                and(
                  eq(guestLogs.sessionId, room.sessionId),
                  eq(guestLogs.currentlyInside, true)
                )
              );

            return {
              ...room,
              activeGuestsCount: activeGuests.length,
              activeGuests: activeGuests,
              guestsInsideCount: guestsInside.length,
              guestsInside: guestsInside,
              hasActiveGuests: activeGuests.length > 0,
              hasGuestsInside: guestsInside.length > 0,
            };
          })
      );

      // Filter to only show rooms with active guests
      const roomsWithActiveGuests = roomsWithGuests.filter(
        room => room.hasActiveGuests
      );

      // Calculate statistics
      const stats = {
        totalRoomsInSection: roomsWithSessions.length,
        roomsWithActiveSessions: roomsWithSessions.filter(r => r.sessionId).length,
        roomsWithActiveGuests: roomsWithActiveGuests.length,
        totalActiveGuests: roomsWithActiveGuests.reduce(
          (sum, room) => sum + room.activeGuestsCount,
          0
        ),
        totalGuestsInside: roomsWithActiveGuests.reduce(
          (sum, room) => sum + room.guestsInsideCount,
          0
        ),
      };

      return NextResponse.json({
        success: true,
        stats,
        rooms: roomsWithActiveGuests,
        currentTime: currentTime.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching nurse dashboard:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch dashboard data" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["nurse"] }
);