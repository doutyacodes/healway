// FILE: app/api/admin/nursing-sections/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nursingSections, hospitalWings, nursingSectionRooms, nurses } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all nursing sections for admin's hospital
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

      // Get sections with wing info and counts
      const sections = await db
        .select({
          id: nursingSections.id,
          sectionName: nursingSections.sectionName,
          wingId: nursingSections.wingId,
          wingName: hospitalWings.wingName,
          description: nursingSections.description,
          isActive: nursingSections.isActive,
          createdAt: nursingSections.createdAt,
          updatedAt: nursingSections.updatedAt,
        })
        .from(nursingSections)
        .leftJoin(hospitalWings, eq(nursingSections.wingId, hospitalWings.id))
        .where(
          and(
            eq(nursingSections.hospitalId, user.hospitalId),
            isNull(nursingSections.deletedAt)
          )
        )
        .orderBy(nursingSections.sectionName);

      // Get counts for each section
      const sectionsWithCounts = await Promise.all(
        sections.map(async (section) => {
          // Get nurse count
          const [nurseCount] = await db
            .select({ count: sql`count(*)` })
            .from(nurses)
            .where(
              and(
                eq(nurses.sectionId, section.id),
                isNull(nurses.deletedAt)
              )
            );

          // Get room count
          const [roomCount] = await db
            .select({ count: sql`count(*)` })
            .from(nursingSectionRooms)
            .where(eq(nursingSectionRooms.sectionId, section.id));

          return {
            ...section,
            nurseCount: Number(nurseCount.count) || 0,
            roomCount: Number(roomCount.count) || 0,
          };
        })
      );

      return NextResponse.json({
        success: true,
        sections: sectionsWithCounts,
        count: sectionsWithCounts.length,
      });
    } catch (error) {
      console.error("Error fetching nursing sections:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch nursing sections" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// POST create nursing section
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

      if (!body.sectionName) {
        return NextResponse.json(
          { success: false, error: "Section name is required" },
          { status: 400 }
        );
      }

      // If wingId is provided, verify it belongs to hospital
      if (body.wingId) {
        const [wing] = await db
          .select()
          .from(hospitalWings)
          .where(
            and(
              eq(hospitalWings.id, body.wingId),
              eq(hospitalWings.hospitalId, user.hospitalId),
              isNull(hospitalWings.deletedAt)
            )
          )
          .limit(1);

        if (!wing) {
          return NextResponse.json(
            { success: false, error: "Wing not found" },
            { status: 404 }
          );
        }
      }

      const [newSection] = await db
        .insert(nursingSections)
        .values({
          hospitalId: user.hospitalId,
          wingId: body.wingId || null,
          sectionName: body.sectionName,
          description: body.description || null,
          isActive: true,
        });

      return NextResponse.json({
        success: true,
        message: "Nursing section created successfully",
        section: {
          id: newSection.insertId,
          ...body,
        },
      });
    } catch (error) {
      console.error("Error creating nursing section:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create nursing section" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);