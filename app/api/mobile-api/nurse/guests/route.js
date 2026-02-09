import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  guests,
  patientSessions,
  nursingSectionRooms,
  guestLogs,
  rooms,
} from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all guests for patients in the nurse's section
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const db = await getDb();

      // 1. Get all rooms in the nurse's section
      const sectionRooms = await db
        .select({ id: nursingSectionRooms.roomId })
        .from(nursingSectionRooms)
        .where(eq(nursingSectionRooms.sectionId, nurse.sectionId));

      if (sectionRooms.length === 0) {
        return NextResponse.json({
          success: true,
          guests: [],
        });
      }

      const roomIds = sectionRooms.map((r) => r.id);

      // 2. Get active sessions in these rooms
      const activeSessions = await db
        .select({
          id: patientSessions.id,
          patientName: sql`(SELECT name FROM users WHERE users.id = ${patientSessions.userId})`,
          roomNumber: sql`(SELECT room_number FROM rooms WHERE rooms.id = ${patientSessions.roomId})`,
        })
        .from(patientSessions)
        .where(
          and(
            inArray(patientSessions.roomId, roomIds),
            eq(patientSessions.status, "active"),
          ),
        );

      if (activeSessions.length === 0) {
        return NextResponse.json({
          success: true,
          guests: [],
        });
      }

      const sessionIds = activeSessions.map((s) => s.id);

      // Map session info for easy lookup
      const sessionMap = activeSessions.reduce((acc, s) => {
        acc[s.id] = s;
        return acc;
      }, {});

      // 3. Get guests for these sessions
      // We also want to know if they are currently inside.
      // We can fetch guests and then fetch their latest log status.

      const guestsList = await db
        .select()
        .from(guests)
        .where(inArray(guests.sessionId, sessionIds))
        .orderBy(desc(guests.createdAt));

      // 4. Enrich with status
      const guestsWithStatus = await Promise.all(
        guestsList.map(async (guest) => {
          const [latestLog] = await db
            .select()
            .from(guestLogs)
            .where(eq(guestLogs.guestId, guest.id))
            .orderBy(desc(guestLogs.entryTime))
            .limit(1);

          return {
            ...guest,
            patientName: sessionMap[guest.sessionId]?.patientName,
            roomNumber: sessionMap[guest.sessionId]?.roomNumber,
            currentlyInside: latestLog ? latestLog.currentlyInside : false,
            lastEntry: latestLog?.entryTime,
            lastExit: latestLog?.exitTime,
          };
        }),
      );

      return NextResponse.json({
        success: true,
        guests: guestsWithStatus,
      });
    } catch (error) {
      console.error("Error fetching section guests:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch guests" },
        { status: 500 },
      );
    }
  },
  { allowedTypes: ["nurse"] },
);
