// FILE: app/api/mobile-api/nurse/guests/[guestId]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { guests, patientSessions, nursingSectionRooms } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET single guest details
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const { guestId } = context.params ?? {};
      const parsedguestId = Number(guestId);

      if (!Number.isInteger(parsedguestId)) {
        return NextResponse.json(
          { success: false, error: "Invalid guestId" },
          { status: 400 }
        );
      }
      const db = await getDb();

      const [guest] = await db
        .select()
        .from(guests)
        .where(eq(guests.id, guestId))
        .limit(1);

      if (!guest) {
        return NextResponse.json(
          { success: false, error: "Guest not found" },
          { status: 404 }
        );
      }

      console.log("Guest visiting hours:", {
        visitingFrom: guest.visitingFrom,
        visitingTo: guest.visitingTo,
        guestId: guest.id
      });

      // Verify nurse has access
      const [session] = await db
        .select({ roomId: patientSessions.roomId })
        .from(patientSessions)
        .where(eq(patientSessions.id, guest.sessionId))
        .limit(1);

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
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        guest,
      });
    } catch (error) {
      console.error("Error fetching guest:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch guest" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["nurse"] }
);

// PUT update guest status or details
export const PUT = withAuth(
  async (request, context, nurse) => {
    try {
      const { guestId } = context.params ?? {};
      const parsedguestId = Number(guestId);

      if (!Number.isInteger(parsedguestId)) {
        return NextResponse.json(
          { success: false, error: "Invalid guestId" },
          { status: 400 }
        );
      }
      const body = await request.json();
      const db = await getDb();

      // Verify access (same as GET)
      const [guest] = await db
        .select()
        .from(guests)
        .where(eq(guests.id, guestId))
        .limit(1);

      if (!guest) {
        return NextResponse.json(
          { success: false, error: "Guest not found" },
          { status: 404 }
        );
      }

      console.log("Current guest visiting hours:", {
        visitingFrom: guest.visitingFrom,
        visitingTo: guest.visitingTo,
        guestId: guest.id
      });

      const [session] = await db
        .select({ roomId: patientSessions.roomId })
        .from(patientSessions)
        .where(eq(patientSessions.id, guest.sessionId))
        .limit(1);

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
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      // Update guest
      const updates = {};
      if (body.status) updates.status = body.status;
      if (body.isActive !== undefined) updates.isActive = body.isActive;
      if (body.notes) updates.purpose = body.notes;
      updates.updatedAt = new Date();

      console.log("Updating guest with:", updates);

      await db.update(guests).set(updates).where(eq(guests.id, guestId));

      return NextResponse.json({
        success: true,
        message: "Guest updated successfully",
      });
    } catch (error) {
      console.error("Error updating guest:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update guest" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["nurse"] }
);