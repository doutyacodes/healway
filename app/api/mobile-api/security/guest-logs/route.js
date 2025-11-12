// FILE: app/api/mobile-api/security/guest-logs/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { guestLogs, guests, patientSessions, users } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET guest logs for security personnel
export const GET = withAuth(
  async (request, context, security) => {
    try {
      const { searchParams } = new URL(request.url);
      const guestId = searchParams.get("guestId");
      const days = parseInt(searchParams.get("days") || "7");
      const limit = parseInt(searchParams.get("limit") || "50");

      const db = await getDb();
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      // Build query
      let query = db
        .select({
          logId: guestLogs.id,
          guestId: guestLogs.guestId,
          guestName: guests.guestName,
          guestPhone: guests.guestPhone,
          patientName: users.name,
          sessionId: guestLogs.sessionId,
          entryTime: guestLogs.entryTime,
          exitTime: guestLogs.exitTime,
          currentlyInside: guestLogs.currentlyInside,
          accessGranted: guestLogs.accessGranted,
          accessDeniedReason: guestLogs.accessDeniedReason,
          notes: guestLogs.notes,
          createdAt: guestLogs.createdAt,
        })
        .from(guestLogs)
        .leftJoin(guests, eq(guestLogs.guestId, guests.id))
        .leftJoin(patientSessions, eq(guestLogs.sessionId, patientSessions.id))
        .leftJoin(users, eq(patientSessions.userId, users.id))
        .where(
          and(
            eq(guestLogs.securityId, security.id),
            gte(guestLogs.entryTime, sinceDate)
          )
        )
        .orderBy(desc(guestLogs.entryTime))
        .limit(limit);

      // Filter by specific guest if provided
      if (guestId) {
        query = query.where(eq(guestLogs.guestId, parseInt(guestId)));
      }

      const logs = await query;

      // Calculate statistics
      const stats = {
        totalLogs: logs.length,
        accessGranted: logs.filter((l) => l.accessGranted).length,
        accessDenied: logs.filter((l) => !l.accessGranted).length,
        currentlyInside: logs.filter((l) => l.currentlyInside).length,
      };

      return NextResponse.json({
        success: true,
        logs,
        stats,
        period: {
          since: sinceDate.toISOString(),
          days,
        },
      });
    } catch (error) {
      console.error("Error fetching guest logs:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch guest logs" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["security"] }
);