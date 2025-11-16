// FILE: app/api/admin/nursing-sections/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nursingSections, hospitalWings, nurses } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET single nursing section
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const {id} = await context.params
      const sectionId = parseInt(id);
      const db = await getDb();

      const [section] = await db
        .select({
          id: nursingSections.id,
          sectionName: nursingSections.sectionName,
          wingId: nursingSections.wingId,
          wingName: hospitalWings.wingName,
          description: nursingSections.description,
          isActive: nursingSections.isActive,
          createdAt: nursingSections.createdAt,
        })
        .from(nursingSections)
        .leftJoin(hospitalWings, eq(nursingSections.wingId, hospitalWings.id))
        .where(
          and(
            eq(nursingSections.id, sectionId),
            eq(nursingSections.hospitalId, user.hospitalId),
            isNull(nursingSections.deletedAt)
          )
        )
        .limit(1);

      if (!section) {
        return NextResponse.json(
          { success: false, error: "Nursing section not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        section,
      });
    } catch (error) {
      console.error("Error fetching nursing section:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch nursing section" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// PUT update nursing section
export const PUT = withAuth(
  async (request, context, user) => {
    try {
            const {id} = await context.params
      const sectionId = parseInt(id);

      const body = await request.json();
      const db = await getDb();

      // Verify section exists and belongs to admin's hospital
      const [existingSection] = await db
        .select()
        .from(nursingSections)
        .where(
          and(
            eq(nursingSections.id, sectionId),
            eq(nursingSections.hospitalId, user.hospitalId),
            isNull(nursingSections.deletedAt)
          )
        )
        .limit(1);

      if (!existingSection) {
        return NextResponse.json(
          { success: false, error: "Nursing section not found" },
          { status: 404 }
        );
      }

      // If wingId is provided, verify it
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

      // Update section
      await db
        .update(nursingSections)
        .set({
          sectionName: body.sectionName || undefined,
          wingId: body.wingId !== undefined ? body.wingId : undefined,
          description: body.description !== undefined ? body.description : undefined,
          updatedAt: new Date(),
        })
        .where(eq(nursingSections.id, sectionId));

      return NextResponse.json({
        success: true,
        message: "Nursing section updated successfully",
      });
    } catch (error) {
      console.error("Error updating nursing section:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update nursing section" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// DELETE nursing section (soft delete)
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
            const {id} = await context.params
      const sectionId = parseInt(id);

      const db = await getDb();

      // Verify section exists and belongs to admin's hospital
      const [existingSection] = await db
        .select()
        .from(nursingSections)
        .where(
          and(
            eq(nursingSections.id, sectionId),
            eq(nursingSections.hospitalId, user.hospitalId),
            isNull(nursingSections.deletedAt)
          )
        )
        .limit(1);

      if (!existingSection) {
        return NextResponse.json(
          { success: false, error: "Nursing section not found" },
          { status: 404 }
        );
      }

      // Check if section has active nurses
      const [nurseCount] = await db
        .select({ count: sql`count(*)` })
        .from(nurses)
        .where(
          and(
            eq(nurses.sectionId, sectionId),
            isNull(nurses.deletedAt)
          )
        );

      if (Number(nurseCount.count) > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot delete section with ${nurseCount.count} active nurse(s). Please reassign them first.`,
          },
          { status: 400 }
        );
      }

      // Soft delete section
      await db
        .update(nursingSections)
        .set({
          deletedAt: new Date(),
          isActive: false,
        })
        .where(eq(nursingSections.id, sectionId));

      // Remove all room assignments
      await db
        .delete(nursingSectionRooms)
        .where(eq(nursingSectionRooms.sectionId, sectionId));

      return NextResponse.json({
        success: true,
        message: "Nursing section deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting nursing section:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete nursing section" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);