import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { guests, patientSessions, nursingSectionRooms } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// POST create new guest for a patient
export const POST = withAuth(
  async (request, context, nurse) => {
    try {
      const db = await getDb();
      const body = await request.json();

      const {
        patientId,
        guestName,
        guestMobile,
        visitType,
        visitDate,
        purpose,
        relationship,
      } = body;

      if (!patientId || !guestName || !guestMobile) {
        return NextResponse.json(
          {
            success: false,
            error: "Patient ID, guest name and mobile are required",
          },
          { status: 400 },
        );
      }

      // 1. Verify Patient Session & Nurse Access
      // We need to find the active session for this patient AND ensure the nurse is assigned to the room's section
      const [session] = await db
        .select({
          id: patientSessions.id,
          roomId: patientSessions.roomId,
          userId: patientSessions.userId,
          hospitalId: patientSessions.hospitalId,
        })
        .from(patientSessions)
        .where(
          and(
            eq(patientSessions.userId, patientId),
            eq(patientSessions.status, "active"),
          ),
        )
        .limit(1);

      if (!session) {
        return NextResponse.json(
          { success: false, error: "No active session found for this patient" },
          { status: 404 },
        );
      }

      // Check if nurse has access to this room (via section)
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
            error:
              "You do not have permission to manage guests for this patient's room",
          },
          { status: 403 },
        );
      }

      // 2. Check active guest limit (max 3)
      const activeGuests = await db
        .select()
        .from(guests)
        .where(
          and(
            eq(guests.sessionId, session.id),
            eq(guests.isActive, true),
            eq(guests.status, "approved"),
          ),
        );

      if (activeGuests.length >= 3) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum 3 active guest passes allowed for this patient",
          },
          { status: 400 },
        );
      }

      if (visitType === "one_time" && !visitDate) {
        return NextResponse.json(
          {
            success: false,
            error: "Visit date is required for one-time visits",
          },
          { status: 400 },
        );
      }

      // 3. Generate Details
      const qrCode = `QR${Date.now()}${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`;

      let validFrom = new Date();
      let validUntil;

      if (visitType === "one_time") {
        validFrom = new Date(visitDate);
        validFrom.setHours(0, 0, 0, 0);
        validUntil = new Date(visitDate);
        validUntil.setHours(23, 59, 59, 999);
      } else {
        // Frequent: Valid for 30 days
        validFrom = new Date();
        validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
      }

      // 4. Create Guest
      // Note: createdByUserId refers to the patient usually, but here a nurse is creating it.
      // The schema says `createdByUserId` which links to `users` table.
      // If the schema enforces FK to `users`, we must use `session.userId` (the patient).
      // If we want to track WHICH nurse created it, we might need an audit log or a different field.
      // For now, we'll attribute it to the patient (since it's FOR them) but maybe add a note or use approvedByAdminId?
      // Actually `approvedByAdminId` is for admin/nurse approval. Since nurse creates it, it's auto-approved.

      const [newGuest] = await db.insert(guests).values({
        createdByUserId: session.userId, // Attribute to patient
        hospitalId: session.hospitalId,
        sessionId: session.id,
        guestName: guestName,
        guestPhone: guestMobile,
        relationshipToPatient: relationship || null,
        guestType: visitType || "one_time",
        validFrom,
        validUntil,
        qrCode,
        qrExpiresAt: validUntil,
        qrScanLimit: visitType === "one_time" ? 2 : null,
        qrScansUsed: 0,
        purpose: purpose || "Created by Nurse",
        status: "approved",
        approvedByAdminId: null, // Could ideally map nurse here if schema allowed, but it links to 'admins' likely?
        // Schema says `approved_by_admin_id` bigint unsigned.
        approvedAt: new Date(),
        isActive: true,
      });

      const [createdGuest] = await db
        .select()
        .from(guests)
        .where(eq(guests.id, newGuest.insertId))
        .limit(1);

      return NextResponse.json({
        success: true,
        message: "Guest pass created successfully",
        guest: createdGuest,
      });
    } catch (error) {
      console.error("Error creating guest:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create guest pass" },
        { status: 500 },
      );
    }
  },
  { allowedTypes: ["nurse"] },
);
