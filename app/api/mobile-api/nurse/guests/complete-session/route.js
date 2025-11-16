// FILE: app/api/mobile-api/nurse/guests/complete-session/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  guests,
  guestLogs,
  patientSessions,
  nursingSectionRooms,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// POST complete/end guest session
export const POST = withAuth(
  async (request, context, nurse) => {
    try {
      const body = await request.json();
      const { guestId, sessionId, notes } = body;

      if (!guestId && !sessionId) {
        return NextResponse.json(
          { success: false, error: "Guest ID or Session ID is required" },
          { status: 400 }
        );
      }

      const db = await getDb();
      const currentTime = new Date();

      // If completing specific guest
      if (guestId) {
        // Get guest details
        const [guest] = await db
          .select({
            id: guests.id,
            sessionId: guests.sessionId,
            guestName: guests.guestName,
            status: guests.status,
            roomId: patientSessions.roomId,
          })
          .from(guests)
          .leftJoin(patientSessions, eq(guests.sessionId, patientSessions.id))
          .where(eq(guests.id, guestId))
          .limit(1);

        if (!guest) {
          return NextResponse.json(
            { success: false, error: "Guest not found" },
            { status: 404 }
          );
        }

        // Verify nurse has access to this room
        const [roomAccess] = await db
          .select()
          .from(nursingSectionRooms)
          .where(
            and(
              eq(nursingSectionRooms.roomId, guest.roomId),
              eq(nursingSectionRooms.sectionId, nurse.sectionId)
            )
          )
          .limit(1);

        if (!roomAccess) {
          return NextResponse.json(
            { success: false, error: "Access denied to this guest's room" },
            { status: 403 }
          );
        }

        // Check if guest is currently inside
        const [currentLog] = await db
          .select()
          .from(guestLogs)
          .where(
            and(
              eq(guestLogs.guestId, guestId),
              eq(guestLogs.currentlyInside, true)
            )
          )
          .limit(1);

        // If guest is inside, check them out first
        if (currentLog) {
          await db
            .update(guestLogs)
            .set({
              exitTime: currentTime,
              currentlyInside: false,
              notes: notes || "Session completed by nurse",
            })
            .where(eq(guestLogs.id, currentLog.id));
        }

        // Mark guest as inactive/expired
        await db
          .update(guests)
          .set({
            status: "expired",
            isActive: false,
            updatedAt: currentTime,
          })
          .where(eq(guests.id, guestId));

        // Create a final log entry if not already checked out
        if (!currentLog) {
          await db.insert(guestLogs).values({
            guestId,
            sessionId: guest.sessionId,
            nurseId: nurse.id,
            entryTime: currentTime,
            exitTime: currentTime,
            currentlyInside: false,
            accessGranted: true,
            notes: notes || "Session completed by nurse - guest was not inside",
          });
        }

        return NextResponse.json({
          success: true,
          message: "Guest session completed successfully",
          guestId,
          wasInside: !!currentLog,
          completedAt: currentTime.toISOString(),
        });
      }

      // If completing all guests for a session
      if (sessionId) {
        // Verify nurse has access to this session's room
        const [session] = await db
          .select()
          .from(patientSessions)
          .where(eq(patientSessions.id, sessionId))
          .limit(1);

        if (!session) {
          return NextResponse.json(
            { success: false, error: "Session not found" },
            { status: 404 }
          );
        }

        const [roomAccess] = await db
          .select()
          .from(nursingSectionRooms)
          .where(
            and(
              eq(nursingSectionRooms.roomId, session.roomId),
              eq(nursingSectionRooms.sectionId, nurse.sectionId)
            )
          )
          .limit(1);

        if (!roomAccess) {
          return NextResponse.json(
            { success: false, error: "Access denied to this session's room" },
            { status: 403 }
          );
        }

        // Get all active guests for this session
        const activeGuests = await db
          .select()
          .from(guests)
          .where(
            and(
              eq(guests.sessionId, sessionId),
              eq(guests.isActive, true)
            )
          );

        // Check out all guests who are currently inside
        for (const guest of activeGuests) {
          const [currentLog] = await db
            .select()
            .from(guestLogs)
            .where(
              and(
                eq(guestLogs.guestId, guest.id),
                eq(guestLogs.currentlyInside, true)
              )
            )
            .limit(1);

          if (currentLog) {
            await db
              .update(guestLogs)
              .set({
                exitTime: currentTime,
                currentlyInside: false,
                notes: notes || "Session completed by nurse - all guests",
              })
              .where(eq(guestLogs.id, currentLog.id));
          }

          // Mark guest as inactive
          await db
            .update(guests)
            .set({
              status: "expired",
              isActive: false,
              updatedAt: currentTime,
            })
            .where(eq(guests.id, guest.id));
        }

        return NextResponse.json({
          success: true,
          message: "All guest sessions completed successfully",
          sessionId,
          guestsCompleted: activeGuests.length,
          completedAt: currentTime.toISOString(),
        });
      }
    } catch (error) {
      console.error("Error completing guest session:", error);
      return NextResponse.json(
        { success: false, error: "Failed to complete guest session" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["nurse"] }
);