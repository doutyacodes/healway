// FILE: app/api/mobile-api/security/grant-access/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { guests, guestLogs, qrScans, patientSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// POST grant or deny access and create log
export const POST = withAuth(
  async (request, context, security) => {
    try {
      const body = await request.json();
      const {
        guestId,
        qrCode,
        accessGranted,
        accessReason,
        denialReason,
        notes,
        deviceInfo,
      } = body;

      if (!guestId) {
        return NextResponse.json(
          { success: false, error: "Guest ID is required" },
          { status: 400 }
        );
      }

      const db = await getDb();
      const currentTime = new Date();

      // Get IP address
      const ipAddress =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      // Fetch guest details
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

      // Check if guest is currently inside
      const [existingLog] = await db
        .select()
        .from(guestLogs)
        .where(
          and(
            eq(guestLogs.guestId, guestId),
            eq(guestLogs.currentlyInside, true)
          )
        )
        .limit(1);

      const isCheckout = !!existingLog;

      // Create QR scan record
      await db.insert(qrScans).values({
        guestId,
        securityId: security.id,
        hospitalId: security.hospitalId,
        scannedAt: currentTime,
        accessGranted: accessGranted === true,
        accessReason: accessReason || null,
        denialReason: denialReason || null,
        deviceInfo: deviceInfo || null,
        ipAddress,
      });

      let logId = null;

      if (accessGranted) {
        if (isCheckout) {
          // Update existing log - checkout
          await db
            .update(guestLogs)
            .set({
              exitTime: currentTime,
              currentlyInside: false,
              notes: notes || existingLog.notes,
            })
            .where(eq(guestLogs.id, existingLog.id));

          logId = existingLog.id;
        } else {
          // Create new log - check-in
          const [newLog] = await db.insert(guestLogs).values({
            guestId,
            sessionId: guest.sessionId,
            securityId: security.id,
            entryTime: currentTime,
            exitTime: null,
            currentlyInside: true,
            accessGranted: true,
            accessDeniedReason: null,
            notes: notes || null,
          });

          logId = newLog.insertId;

          // Increment QR scan count if there's a limit
          if (guest.qrScanLimit !== null) {
            await db
              .update(guests)
              .set({
                qrScansUsed: guest.qrScansUsed + 1,
              })
              .where(eq(guests.id, guestId));
          }
        }
      } else {
        // Access denied - create log with denial
        const [deniedLog] = await db.insert(guestLogs).values({
          guestId,
          sessionId: guest.sessionId,
          securityId: security.id,
          entryTime: currentTime,
          exitTime: currentTime,
          currentlyInside: false,
          accessGranted: false,
          accessDeniedReason: denialReason || "Access denied by security",
          notes: notes || null,
        });

        logId = deniedLog.insertId;
      }

      return NextResponse.json({
        success: true,
        message: accessGranted
          ? isCheckout
            ? "Guest checked out successfully"
            : "Access granted - Guest checked in"
          : "Access denied - Log created",
        logId,
        accessGranted,
        isCheckout,
        timestamp: currentTime.toISOString(),
      });
    } catch (error) {
      console.error("Error granting access:", error);
      return NextResponse.json(
        { success: false, error: "Failed to process access request" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["security"] }
);