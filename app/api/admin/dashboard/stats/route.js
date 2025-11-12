// FILE: app/api/admin/dashboard/stats/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitalWings, rooms, patientSessions } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET dashboard statistics
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Count total wings
      const [wingsCount] = await db
        .select({ count: sql`COUNT(*)` })
        .from(hospitalWings)
        .where(
          and(
            eq(hospitalWings.hospitalId, user.hospitalId),
            isNull(hospitalWings.deletedAt)
          )
        );

      // Count active wings
      const [activeWingsCount] = await db
        .select({ count: sql`COUNT(*)` })
        .from(hospitalWings)
        .where(
          and(
            eq(hospitalWings.hospitalId, user.hospitalId),
            eq(hospitalWings.isActive, true),
            isNull(hospitalWings.deletedAt)
          )
        );

      // Count total rooms
      const [roomsCount] = await db
        .select({ count: sql`COUNT(*)` })
        .from(rooms)
        .innerJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
        .where(
          and(
            eq(hospitalWings.hospitalId, user.hospitalId),
            isNull(rooms.deletedAt)
          )
        );

      // Count occupied rooms
      const [occupiedRoomsCount] = await db
        .select({ count: sql`COUNT(DISTINCT ${patientSessions.roomId})` })
        .from(patientSessions)
        .innerJoin(hospitalWings, eq(patientSessions.wingId, hospitalWings.id))
        .where(
          and(
            eq(hospitalWings.hospitalId, user.hospitalId),
            eq(patientSessions.status, "active")
          )
        );

      return NextResponse.json({
        success: true,
        stats: {
          totalWings: parseInt(wingsCount.count) || 0,
          activeWings: parseInt(activeWingsCount.count) || 0,
          totalRooms: parseInt(roomsCount.count) || 0,
          occupiedRooms: parseInt(occupiedRoomsCount.count) || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);