// FILE: app/api/admin/wings/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitalWings } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET single wing
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const wingId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      const [wing] = await db
        .select()
        .from(hospitalWings)
        .where(
          and(
            eq(hospitalWings.id, wingId),
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

      return NextResponse.json({
        success: true,
        wing,
      });
    } catch (error) {
      console.error("Error fetching wing:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch wing" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// PUT update wing
export const PUT = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const wingId = parseInt(id);
      const body = await request.json();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if wing exists and belongs to admin's hospital
      const [existingWing] = await db
        .select()
        .from(hospitalWings)
        .where(
          and(
            eq(hospitalWings.id, wingId),
            eq(hospitalWings.hospitalId, user.hospitalId),
            isNull(hospitalWings.deletedAt)
          )
        )
        .limit(1);

      if (!existingWing) {
        return NextResponse.json(
          { success: false, error: "Wing not found" },
          { status: 404 }
        );
      }

      // Update wing
      await db
        .update(hospitalWings)
        .set({
          wingName: body.wingName || existingWing.wingName,
          wingCode:
            body.wingCode !== undefined ? body.wingCode : existingWing.wingCode,
          floorNumber:
            body.floorNumber !== undefined
              ? body.floorNumber
              : existingWing.floorNumber,
          description:
            body.description !== undefined
              ? body.description
              : existingWing.description,
          updatedAt: new Date(),
        })
        .where(eq(hospitalWings.id, wingId));

      // Fetch updated wing
      const [updatedWing] = await db
        .select()
        .from(hospitalWings)
        .where(eq(hospitalWings.id, wingId))
        .limit(1);

      return NextResponse.json({
        success: true,
        message: "Wing updated successfully",
        wing: updatedWing,
      });
    } catch (error) {
      console.error("Error updating wing:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update wing" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// DELETE wing (soft delete)
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const wingId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if wing exists and belongs to admin's hospital
      const [existingWing] = await db
        .select()
        .from(hospitalWings)
        .where(
          and(
            eq(hospitalWings.id, wingId),
            eq(hospitalWings.hospitalId, user.hospitalId),
            isNull(hospitalWings.deletedAt)
          )
        )
        .limit(1);

      if (!existingWing) {
        return NextResponse.json(
          { success: false, error: "Wing not found" },
          { status: 404 }
        );
      }

      // Soft delete - set deletedAt timestamp
      await db
        .update(hospitalWings)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(hospitalWings.id, wingId));

      return NextResponse.json({
        success: true,
        message: "Wing deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting wing:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete wing" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);
