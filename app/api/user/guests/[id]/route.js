// FILE: app/api/user/guests/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { guests, patientSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET single guest
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const guestId = parseInt(await context.params.id);

      const [guest] = await db
        .select({
          id: guests.id,
          sessionId: guests.sessionId,
          guestName: guests.guestName,
          guestPhone: guests.guestPhone,
          relationshipToPatient: guests.relationshipToPatient,
          guestType: guests.guestType,
          validFrom: guests.validFrom,
          validUntil: guests.validUntil,
          qrCode: guests.qrCode,
          purpose: guests.purpose,
          status: guests.status,
          userId: patientSessions.userId,
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

      // Verify guest belongs to this user
      if (guest.userId !== user.id) {
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
  { allowedTypes: ["user"] }
);

// PUT update guest
export const PUT = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const guestId = parseInt(await context.params.id);
      const body = await request.json();

      // Check if guest exists and belongs to user
      const [existingGuest] = await db
        .select({
          id: guests.id,
          sessionId: guests.sessionId,
          status: guests.status,
          userId: patientSessions.userId,
        })
        .from(guests)
        .leftJoin(patientSessions, eq(guests.sessionId, patientSessions.id))
        .where(eq(guests.id, guestId))
        .limit(1);

      if (!existingGuest) {
        return NextResponse.json(
          { success: false, error: "Guest not found" },
          { status: 404 }
        );
      }

      if (existingGuest.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      // Cannot edit if already expired or revoked
      if (existingGuest.status === "expired" || existingGuest.status === "revoked") {
        return NextResponse.json(
          { success: false, error: "Cannot edit expired or revoked guest pass" },
          { status: 400 }
        );
      }

      // Update validity if visit type or date changes
      let updateData = {
        guestName: body.guestName || undefined,
        guestPhone: body.guestMobile || undefined,
        relationshipToPatient: body.relationship !== undefined ? body.relationship : undefined,
        guestType: body.visitType || undefined,
        purpose: body.purpose !== undefined ? body.purpose : undefined,
        updatedAt: new Date(),
      };

      // Update validity dates if needed
      if (body.visitType && body.visitDate) {
        if (body.visitType === "one_time") {
          const validFrom = new Date(body.visitDate);
          validFrom.setHours(0, 0, 0, 0);
          const validUntil = new Date(body.visitDate);
          validUntil.setHours(23, 59, 59, 999);
          
          updateData.validFrom = validFrom;
          updateData.validUntil = validUntil;
          updateData.qrExpiresAt = validUntil;
          updateData.qrScanLimit = 2;
        }
      }

      // Update guest
      await db
        .update(guests)
        .set(updateData)
        .where(eq(guests.id, guestId));

      return NextResponse.json({
        success: true,
        message: "Guest pass updated successfully",
      });
    } catch (error) {
      console.error("Error updating guest:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update guest" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["user"] }
);

// DELETE guest (revoke)
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const guestId = parseInt(await context.params.id);

      // Check if guest exists and belongs to user
      const [existingGuest] = await db
        .select({
          id: guests.id,
          userId: patientSessions.userId,
        })
        .from(guests)
        .leftJoin(patientSessions, eq(guests.sessionId, patientSessions.id))
        .where(eq(guests.id, guestId))
        .limit(1);

      if (!existingGuest) {
        return NextResponse.json(
          { success: false, error: "Guest not found" },
          { status: 404 }
        );
      }

      if (existingGuest.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      // Revoke guest pass
      await db
        .update(guests)
        .set({
          status: "revoked",
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(guests.id, guestId));

      return NextResponse.json({
        success: true,
        message: "Guest pass revoked successfully",
      });
    } catch (error) {
      console.error("Error revoking guest:", error);
      return NextResponse.json(
        { success: false, error: "Failed to revoke guest" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["user"] }
);