// FILE: app/api/admin/nursing-sections/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nursingSections, hospitalWings } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET single nursing section
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const sectionId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      const [section] = await db
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
      const db = await getDb();
      const { id } = await context.params;

      const sectionId = parseInt(id);
      const body = await request.json();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if section exists
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

      // Verify wing if provided
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
          sectionName: body.sectionName || existingSection.sectionName,
          wingId:
            body.wingId !== undefined ? body.wingId : existingSection.wingId,
          description:
            body.description !== undefined
              ? body.description
              : existingSection.description,
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
      const db = await getDb();
      const { id } = await context.params;

      const sectionId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if section exists
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

      // Soft delete
      await db
        .update(nursingSections)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(nursingSections.id, sectionId));

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
