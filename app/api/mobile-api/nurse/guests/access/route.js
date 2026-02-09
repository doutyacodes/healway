import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  guests,
  guestLogs,
  patientSessions,
  nursingSectionRooms,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// POST grant or deny access (Check-in / Check-out)
export const POST = withAuth(
  async (request, context, nurse) => {
    try {
      const body = await request.json();
      const { guestId, action } = body; // action: 'check-in' | 'check-out'

      if (!guestId || !["check-in", "check-out"].includes(action)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Guest ID and valid action (check-in/check-out) are required",
          },
          { status: 400 },
        );
      }

      const db = await getDb();
      const currentTime = new Date();

      // 1. Fetch guest details & Verify Nurse Access
      const [guest] = await db
        .select()
        .from(guests)
        .where(eq(guests.id, guestId))
        .limit(1);

      if (!guest) {
        return NextResponse.json(
          { success: false, error: "Guest not found" },
          { status: 404 },
        );
      }

      // Find session to check room
      const [session] = await db
        .select({ id: patientSessions.id, roomId: patientSessions.roomId })
        .from(patientSessions)
        .where(eq(patientSessions.id, guest.sessionId))
        .limit(1);

      if (!session) {
        return NextResponse.json(
          {
            success: false,
            error: "Associated patient session not active or found",
          },
          { status: 404 },
        );
      }

      // Check nurse section access
      const [roomAccess] = await db
        .select()
        .from(nursingSectionRooms)
        .where(
          and(
            eq(nursingSectionRooms.roomId, session.roomId),
            eq(nursingSectionRooms.sectionId, nurse.sectionId),
          ),
        )
        .limit(1);

      if (!roomAccess) {
        return NextResponse.json(
          {
            success: false,
            error: "Access denied. You cannot manage guests for this room.",
          },
          { status: 403 },
        );
      }

      // 2. Handle Action

      // Check current status
      const [latestLog] = await db
        .select()
        .from(guestLogs)
        .where(eq(guestLogs.guestId, guestId))
        .orderBy(desc(guestLogs.entryTime))
        .limit(1);

      const isCurrentlyInside = latestLog && latestLog.currentlyInside;

      if (action === "check-in") {
        if (isCurrentlyInside) {
          return NextResponse.json(
            { success: false, error: "Guest is already checked in" },
            { status: 400 },
          );
        }

        // Validate guest status (must be approved)
        if (guest.status !== "approved") {
          return NextResponse.json(
            { success: false, error: "Guest pass is not approved" },
            { status: 400 },
          );
        }

        // Validate dates
        if (
          new Date() < new Date(guest.validFrom) ||
          new Date() > new Date(guest.validUntil)
        ) {
          return NextResponse.json(
            { success: false, error: "Guest pass is expired or not yet valid" },
            { status: 400 },
          );
        }

        // Create Check-in Log
        await db.insert(guestLogs).values({
          guestId,
          sessionId: guest.sessionId,
          nurseId: nurse.id, // Attributed to Nurse
          entryTime: currentTime,
          exitTime: null,
          currentlyInside: true,
          accessGranted: true,
          notes: "Checked in manually by Nurse",
        });
      } else if (action === "check-out") {
        if (!isCurrentlyInside) {
          return NextResponse.json(
            { success: false, error: "Guest is not currently checked in" },
            { status: 400 },
          );
        }

        // Update Check-out Log
        await db
          .update(guestLogs)
          .set({
            exitTime: currentTime,
            currentlyInside: false,
            notes: latestLog.notes
              ? `${latestLog.notes} | Checked out by Nurse`
              : "Checked out by Nurse",
          })
          .where(eq(guestLogs.id, latestLog.id));
      }

      return NextResponse.json({
        success: true,
        message: `Guest ${action} successful`,
      });
    } catch (error) {
      console.error("Error processing guest access:", error);
      return NextResponse.json(
        { success: false, error: "Failed to process request" },
        { status: 500 },
      );
    }
  },
  { allowedTypes: ["nurse"] },
);
