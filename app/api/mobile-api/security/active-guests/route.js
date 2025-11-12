// FILE: app/api/mobile-api/security/active-guests/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  guests,
  patientSessions,
  users,
  hospitalWings,
  rooms,
  guestLogs,
} from "@/lib/db/schema";
import { eq, and, lte, gte, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers"; // Using withAuth which now supports both

// GET all active guests for security personnel
export const GET = withAuth(
  async (request, context, security) => {
    try {
      const db = await getDb();
      const currentTime = new Date();

      // Get all active guests for this hospital
      const baseConditions = [
        eq(guests.hospitalId, security.hospitalId),
        eq(guests.status, "approved"),
        eq(guests.isActive, true),
        lte(guests.validFrom, currentTime),
        gte(guests.validUntil, currentTime),
        eq(patientSessions.status, "active"),
      ];

      // Add wing filter if security has assigned wing
      if (security.assignedWingId) {
        baseConditions.push(eq(patientSessions.wingId, security.assignedWingId));
      }

      const activeGuests = await db
        .select({
          // Guest info
          guestId: guests.id,
          guestName: guests.guestName,
          guestPhone: guests.guestPhone,
          relationshipToPatient: guests.relationshipToPatient,
          guestType: guests.guestType,
          qrCode: guests.qrCode,
          validFrom: guests.validFrom,
          validUntil: guests.validUntil,
          status: guests.status,
          purpose: guests.purpose,
          qrScanLimit: guests.qrScanLimit,
          qrScansUsed: guests.qrScansUsed,
          
          // Session info
          sessionId: patientSessions.id,
          sessionStatus: patientSessions.status,
          patientUserId: patientSessions.userId,
          wingId: patientSessions.wingId,
          roomId: patientSessions.roomId,
          
          // Patient info
          patientName: users.name,
          patientMobile: users.mobileNumber,
          
          // Location info
          wingName: hospitalWings.wingName,
          roomNumber: rooms.roomNumber,
          
          // Current status
          currentlyInside: guestLogs.currentlyInside,
          lastEntryTime: guestLogs.entryTime,
        })
        .from(guests)
        .leftJoin(patientSessions, eq(guests.sessionId, patientSessions.id))
        .leftJoin(users, eq(patientSessions.userId, users.id))
        .leftJoin(hospitalWings, eq(patientSessions.wingId, hospitalWings.id))
        .leftJoin(rooms, eq(patientSessions.roomId, rooms.id))
        .leftJoin(
          guestLogs,
          and(
            eq(guestLogs.guestId, guests.id),
            eq(guestLogs.currentlyInside, true)
          )
        )
        .where(and(...baseConditions));

      // Enhance with additional status info
      const enhancedGuests = activeGuests.map((guest) => ({
        ...guest,
        isExpired: new Date(guest.validUntil) < currentTime,
        isSessionActive: guest.sessionStatus === "active",
        isCurrentlyInside: guest.currentlyInside === true,
        canEnter: 
          guest.status === "approved" &&
          guest.sessionStatus === "active" &&
          new Date(guest.validUntil) >= currentTime &&
          (guest.qrScanLimit === null || guest.qrScansUsed < guest.qrScanLimit),
      }));

      return NextResponse.json({
        success: true,
        guests: enhancedGuests,
        count: enhancedGuests.length,
        currentTime: currentTime.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching active guests:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch active guests" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["security"] }
);