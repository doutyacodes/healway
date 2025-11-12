// FILE: app/api/user/guests/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { guests, patientSessions } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all guests for the user
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();

      // Get user's active session
      const [session] = await db
        .select()
        .from(patientSessions)
        .where(
          and(
            eq(patientSessions.userId, user.id),
            eq(patientSessions.status, "active")
          )
        )
        .limit(1);

      if (!session) {
        return NextResponse.json({
          success: true,
          guests: [],
          message: "No active session",
        });
      }

      // Get all guests for this session
      const guestsList = await db
        .select()
        .from(guests)
        .where(eq(guests.sessionId, session.id))
        .orderBy(desc(guests.createdAt));

      return NextResponse.json({
        success: true,
        guests: guestsList,
        count: guestsList.length,
      });
    } catch (error) {
      console.error("Error fetching guests:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch guests" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["user"] }
);

// POST create new guest
export const POST = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const body = await request.json();

      // Get user's active session
      const [session] = await db
        .select()
        .from(patientSessions)
        .where(
          and(
            eq(patientSessions.userId, user.id),
            eq(patientSessions.status, "active")
          )
        )
        .limit(1);

      if (!session) {
        return NextResponse.json(
          { success: false, error: "No active session found" },
          { status: 404 }
        );
      }

      // Check active guest limit (max 3)
      const activeGuests = await db
        .select()
        .from(guests)
        .where(
          and(
            eq(guests.sessionId, session.id),
            eq(guests.isActive, true),
            eq(guests.status, "approved")
          )
        );

      if (activeGuests.length >= 3) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum 3 active guest passes allowed",
          },
          { status: 400 }
        );
      }

      // Validation
      if (!body.guestName || !body.guestMobile) {
        return NextResponse.json(
          { success: false, error: "Guest name and mobile are required" },
          { status: 400 }
        );
      }

      if (body.visitType === "one_time" && !body.visitDate) {
        return NextResponse.json(
          { success: false, error: "Visit date is required for one-time visits" },
          { status: 400 }
        );
      }

      // Generate unique QR code
      const qrCode = `QR${Date.now()}${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`;

      // Set validity period
      let validFrom = new Date();
      let validUntil;

      if (body.visitType === "one_time") {
        // One-time: Valid for the specific date
        validFrom = new Date(body.visitDate);
        validFrom.setHours(0, 0, 0, 0);
        validUntil = new Date(body.visitDate);
        validUntil.setHours(23, 59, 59, 999);
      } else {
        // Frequent: Valid for 30 days
        validFrom = new Date();
        validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
      }

      // Create guest
      const [newGuest] = await db.insert(guests).values({
        createdByUserId: user.id,
        hospitalId: user.hospitalId,
        sessionId: session.id,
        guestName: body.guestName,
        guestPhone: body.guestMobile,
        relationshipToPatient: body.relationship || null,
        guestType: body.visitType || "one_time",
        validFrom,
        validUntil,
        qrCode,
        qrExpiresAt: validUntil,
        qrScanLimit: body.visitType === "one_time" ? 2 : null, // One entry + one exit
        qrScansUsed: 0,
        purpose: body.purpose || null,
        status: "approved", // Auto-approve for now
        approvedByAdminId: null,
        approvedAt: new Date(),
        isActive: true,
      });

      // Fetch the created guest
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
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["user"] }
);