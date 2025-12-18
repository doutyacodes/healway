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
  nursePatientAssignments,
} from "@/lib/db/schema";
import { eq, and, sql, isNull, or } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET dashboard with rooms that have active guests
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const db = await getDb();
      const currentTime = new Date();

      console.log("Fetching dashboard for nurse:", nurse.id, "Section:", nurse.sectionId, "Hospital:", nurse.hospitalId);

      // ✅ FIXED: Get rooms in nurse's section AND hospital
      const sectionRoomIds = await db
        .select({ 
          roomId: nursingSectionRooms.roomId,
          wingId: rooms.wingId,
        })
        .from(nursingSectionRooms)
        .innerJoin(rooms, eq(nursingSectionRooms.roomId, rooms.id))
        .innerJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
        .where(
          and(
            eq(nursingSectionRooms.sectionId, nurse.sectionId),
            eq(hospitalWings.hospitalId, nurse.hospitalId) // ✅ Hospital validation
          )
        );

      console.log("Section rooms found:", sectionRoomIds.length);

      // ✅ FIXED: Get patients directly assigned to this nurse (with hospital check)
      const assignedPatientSessions = await db
        .select({ sessionId: nursePatientAssignments.sessionId })
        .from(nursePatientAssignments)
        .innerJoin(patientSessions, eq(nursePatientAssignments.sessionId, patientSessions.id))
        .where(
          and(
            eq(nursePatientAssignments.nurseId, nurse.id),
            eq(nursePatientAssignments.isActive, true),
            eq(patientSessions.hospitalId, nurse.hospitalId) // ✅ Hospital validation
          )
        );

      console.log("Assigned patient sessions:", assignedPatientSessions.length);

      // Get all active sessions in section rooms OR assigned to nurse
      const roomIds = sectionRoomIds.map(r => r.roomId);
      const sessionIds = assignedPatientSessions.map(s => s.sessionId);

      // Build the where condition
      const whereConditions = [
        eq(patientSessions.status, "active"),
        eq(patientSessions.hospitalId, nurse.hospitalId) // ✅ Always filter by hospital
      ];
      
      if (roomIds.length > 0 && sessionIds.length > 0) {
        // Nurse has both section access and direct assignments
        whereConditions.push(
          or(
            roomIds.length > 0 ? sql`${patientSessions.roomId} IN (${sql.join(roomIds, sql`, `)})` : sql`1=0`,
            sessionIds.length > 0 ? sql`${patientSessions.id} IN (${sql.join(sessionIds, sql`, `)})` : sql`1=0`
          )
        );
      } else if (roomIds.length > 0) {
        // Only section rooms
        whereConditions.push(sql`${patientSessions.roomId} IN (${sql.join(roomIds, sql`, `)})`);
      } else if (sessionIds.length > 0) {
        // Only direct assignments
        whereConditions.push(sql`${patientSessions.id} IN (${sql.join(sessionIds, sql`, `)})`);
      } else {
        // No access - return empty
        console.log("Nurse has no room access or patient assignments");
        return NextResponse.json({
          success: true,
          stats: {
            totalRoomsInSection: 0,
            roomsWithActiveSessions: 0,
            roomsWithActiveGuests: 0,
            totalActiveGuests: 0,
            totalGuestsInside: 0,
            assignedPatientsCount: 0,
          },
          rooms: [],
          currentTime: currentTime.toISOString(),
          message: "No rooms or patients assigned yet",
        });
      }

      // Get sessions with all related info
      const activeSessions = await db
        .select({
          // Session info
          sessionId: patientSessions.id,
          sessionStatus: patientSessions.status,
          sessionStartDate: patientSessions.startDate,
          
          // Room info
          roomId: rooms.id,
          roomNumber: rooms.roomNumber,
          roomType: rooms.roomType,
          
          // Wing info
          wingId: hospitalWings.id,
          wingName: hospitalWings.wingName,
          
          // Patient info
          patientId: users.id,
          patientName: users.name,
          patientMobile: users.mobileNumber,
          patientRole: users.role,
        })
        .from(patientSessions)
        .innerJoin(rooms, eq(patientSessions.roomId, rooms.id))
        .innerJoin(hospitalWings, eq(patientSessions.wingId, hospitalWings.id))
        .innerJoin(users, eq(patientSessions.userId, users.id))
        .where(and(...whereConditions));

      console.log("Active sessions found:", activeSessions.length);

      // For each session, get guest information
      const roomsWithGuests = await Promise.all(
        activeSessions.map(async (session) => {
          // Check if this patient is directly assigned to nurse
          const isDirectlyAssigned = sessionIds.includes(session.sessionId);

          // ✅ FIXED: Get all active guests for this session (with hospital check)
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
                eq(guests.sessionId, session.sessionId),
                eq(guests.hospitalId, nurse.hospitalId), // ✅ Hospital validation
                eq(guests.status, "approved"),
                eq(guests.isActive, true)
              )
            );

          // ✅ FIXED: Get currently inside guests (with hospital check)
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
                eq(guestLogs.sessionId, session.sessionId),
                eq(guests.hospitalId, nurse.hospitalId), // ✅ Hospital validation
                eq(guestLogs.currentlyInside, true)
              )
            );

          return {
            roomId: session.roomId,
            roomNumber: session.roomNumber,
            roomType: session.roomType,
            wingId: session.wingId,
            wingName: session.wingName,
            sessionId: session.sessionId,
            sessionStatus: session.sessionStatus,
            sessionStartDate: session.sessionStartDate,
            patientId: session.patientId,
            patientName: session.patientName,
            patientMobile: session.patientMobile,
            patientRole: session.patientRole,
            isDirectlyAssigned,
            activeGuestsCount: activeGuests.length,
            activeGuests: activeGuests,
            guestsInsideCount: guestsInside.length,
            guestsInside: guestsInside,
            hasActiveGuests: activeGuests.length > 0,
            hasGuestsInside: guestsInside.length > 0,
          };
        })
      );

      console.log("Rooms with guest data:", roomsWithGuests.length);

      // Filter to only show rooms with active guests
      const roomsWithActiveGuests = roomsWithGuests.filter(
        room => room.hasActiveGuests
      );

      // Calculate statistics
      const stats = {
        totalRoomsInSection: sectionRoomIds.length,
        roomsWithActiveSessions: activeSessions.length,
        roomsWithActiveGuests: roomsWithActiveGuests.length,
        totalActiveGuests: roomsWithGuests.reduce(
          (sum, room) => sum + room.activeGuestsCount,
          0
        ),
        totalGuestsInside: roomsWithGuests.reduce(
          (sum, room) => sum + room.guestsInsideCount,
          0
        ),
        assignedPatientsCount: roomsWithGuests.filter(r => r.isDirectlyAssigned).length,
      };

      console.log("Stats:", stats);

      return NextResponse.json({
        success: true,
        stats,
        rooms: roomsWithActiveGuests, // Only rooms with active guests
        allRooms: roomsWithGuests, // All accessible rooms (for debugging)
        currentTime: currentTime.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching nurse dashboard:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch dashboard data", details: error.message },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["nurse"] }
);