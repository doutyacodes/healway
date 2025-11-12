// FILE: app/api/admin/wings/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitalWings, visitingHours, rooms } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all wings for the admin's hospital
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

      // Fetch wings with room counts and visiting hours
      const wings = await db
        .select({
          id: hospitalWings.id,
          wingName: hospitalWings.wingName,
          wingCode: hospitalWings.wingCode,
          floorNumber: hospitalWings.floorNumber,
          description: hospitalWings.description,
          isActive: hospitalWings.isActive,
          createdAt: hospitalWings.createdAt,
        })
        .from(hospitalWings)
        .where(
          and(
            eq(hospitalWings.hospitalId, user.hospitalId),
            isNull(hospitalWings.deletedAt)
          )
        )
        .orderBy(hospitalWings.createdAt);

      // Fetch room counts for each wing
      const wingIds = wings.map(w => w.id);
      const roomCounts = await db
        .select({
          wingId: rooms.wingId,
          count: sql`COUNT(*)`,
        })
        .from(rooms)
        .where(
          and(
            sql`${rooms.wingId} IN (${sql.join(wingIds, sql`, `)})`,
            isNull(rooms.deletedAt)
          )
        )
        .groupBy(rooms.wingId);

      // Fetch visiting hours for each wing
      const visitingHoursList = await db
        .select()
        .from(visitingHours)
        .where(
          and(
            eq(visitingHours.hospitalId, user.hospitalId),
            sql`${visitingHours.wingId} IN (${sql.join(wingIds, sql`, `)})`
          )
        );

      // Combine data
      const wingsWithData = wings.map(wing => {
        const roomCountData = roomCounts.find(rc => rc.wingId === wing.id);
        const wingVisitingHours = visitingHoursList.filter(
          vh => vh.wingId === wing.id
        );

        return {
          ...wing,
          roomCount: parseInt(roomCountData?.count || 0),
          visitingHoursCount: wingVisitingHours.length,
          visitingHours: wingVisitingHours,
        };
      });

      return NextResponse.json({
        success: true,
        wings: wingsWithData,
        count: wingsWithData.length,
      });
    } catch (error) {
      console.error("Error fetching wings:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch wings" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// POST create new wing
export const POST = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const body = await request.json();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Validation
      if (!body.wingName) {
        return NextResponse.json(
          { success: false, error: "Wing name is required" },
          { status: 400 }
        );
      }

      // Insert wing
      const [newWing] = await db
        .insert(hospitalWings)
        .values({
          hospitalId: user.hospitalId,
          wingName: body.wingName,
          wingCode: body.wingCode || null,
          floorNumber: body.floorNumber || null,
          description: body.description || null,
          isActive: true,
        });

      return NextResponse.json({
        success: true,
        message: "Wing created successfully",
        wing: {
          id: newWing.insertId,
          ...body,
        },
      });
    } catch (error) {
      console.error("Error creating wing:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create wing" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);