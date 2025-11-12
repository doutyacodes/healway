// FILE: app/api/mobile-api/security/dashboard/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { guests, guestLogs, qrScans, patientSessions } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET dashboard statistics for security
export const GET = withAuth(
  async (request, context, security) => {
    try {
      const db = await getDb();
      const currentTime = new Date();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Get active guests count
      const activeGuestsQuery = db
        .select({ count: sql`count(*)` })
        .from(guests)
        .leftJoin(patientSessions, eq(guests.sessionId, patientSessions.id))
        .where(
          and(
            eq(guests.hospitalId, security.hospitalId),
            eq(guests.status, "approved"),
            eq(guests.isActive, true),
            eq(patientSessions.status, "active")
          )
        );

      const [activeGuestsResult] = security.assignedWingId
        ? await activeGuestsQuery.where(
            eq(patientSessions.wingId, security.assignedWingId)
          )
        : await activeGuestsQuery;

      // Get currently inside count
      const [currentlyInsideResult] = await db
        .select({ count: sql`count(*)` })
        .from(guestLogs)
        .leftJoin(guests, eq(guestLogs.guestId, guests.id))
        .leftJoin(patientSessions, eq(guestLogs.sessionId, patientSessions.id))
        .where(
          and(
            eq(guestLogs.currentlyInside, true),
            eq(guests.hospitalId, security.hospitalId),
            security.assignedWingId
              ? eq(patientSessions.wingId, security.assignedWingId)
              : undefined
          )
        );

      // Get today's scans by this security
      const [todayScansResult] = await db
        .select({ count: sql`count(*)` })
        .from(qrScans)
        .where(
          and(
            eq(qrScans.securityId, security.id),
            gte(qrScans.scannedAt, todayStart)
          )
        );

      // Get today's granted/denied counts
      const [todayGrantedResult] = await db
        .select({ count: sql`count(*)` })
        .from(qrScans)
        .where(
          and(
            eq(qrScans.securityId, security.id),
            eq(qrScans.accessGranted, true),
            gte(qrScans.scannedAt, todayStart)
          )
        );

      const [todayDeniedResult] = await db
        .select({ count: sql`count(*)` })
        .from(qrScans)
        .where(
          and(
            eq(qrScans.securityId, security.id),
            eq(qrScans.accessGranted, false),
            gte(qrScans.scannedAt, todayStart)
          )
        );

      // Get recent activity (last 10 scans)
      const recentActivity = await db
        .select({
          scanId: qrScans.id,
          scannedAt: qrScans.scannedAt,
          accessGranted: qrScans.accessGranted,
          guestName: guests.guestName,
          patientName: sql`(SELECT name FROM users WHERE id = (SELECT user_id FROM patient_sessions WHERE id = ${guests.sessionId}))`,
        })
        .from(qrScans)
        .leftJoin(guests, eq(qrScans.guestId, guests.id))
        .where(eq(qrScans.securityId, security.id))
        .orderBy(sql`${qrScans.scannedAt} DESC`)
        .limit(10);

      const stats = {
        activeGuests: Number(activeGuestsResult.count) || 0,
        currentlyInside: Number(currentlyInsideResult.count) || 0,
        todayScans: Number(todayScansResult.count) || 0,
        todayGranted: Number(todayGrantedResult.count) || 0,
        todayDenied: Number(todayDeniedResult.count) || 0,
      };

      return NextResponse.json({
        success: true,
        stats,
        recentActivity,
        currentTime: currentTime.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch dashboard statistics" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["security"] }
);