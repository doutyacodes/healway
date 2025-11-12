// FILE: app/api/user/guests/arrivals/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { 
  guestLogs, 
  guests, 
  patientSessions,
  securities 
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all guest arrivals/visits for user's guests
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
          arrivals: [],
          message: "No active session",
        });
      }

      // Get all visit logs for this session's guests
      const arrivals = await db
        .select({
          id: guestLogs.id,
          guestId: guestLogs.guestId,
          guestName: guests.guestName,
          guestPhone: guests.guestPhone,
          relationshipToPatient: guests.relationshipToPatient,
          entryTime: guestLogs.entryTime,
          exitTime: guestLogs.exitTime,
          currentlyInside: guestLogs.currentlyInside,
          accessGranted: guestLogs.accessGranted,
          accessDeniedReason: guestLogs.accessDeniedReason,
          verifiedById: guestLogs.securityId,
          verifiedBy: securities.name,
          notes: guestLogs.notes,
          createdAt: guestLogs.createdAt,
        })
        .from(guestLogs)
        .leftJoin(guests, eq(guestLogs.guestId, guests.id))
        .leftJoin(securities, eq(guestLogs.securityId, securities.id))
        .where(eq(guestLogs.sessionId, session.id))
        .orderBy(desc(guestLogs.entryTime));

      // Map to match frontend expectations
      const formattedArrivals = arrivals.map((arrival) => ({
        ...arrival,
        guestMobile: arrival.guestPhone,
        relationship: arrival.relationshipToPatient,
        checkInTime: arrival.entryTime,
        checkOutTime: arrival.exitTime,
        verificationStatus: arrival.accessGranted ? "approved" : "rejected",
      }));

      return NextResponse.json({
        success: true,
        arrivals: formattedArrivals,
        count: formattedArrivals.length,
      });
    } catch (error) {
      console.error("Error fetching guest arrivals:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch guest arrivals" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["user"] }
);