// FILE: app/api/admin/nursing-sections/[id]/toggle-status/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nursingSections } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// PATCH toggle nursing section status
export const PATCH = withAuth(
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

      await db
        .update(nursingSections)
        .set({
          isActive: !section.isActive,
          updatedAt: new Date(),
        })
        .where(eq(nursingSections.id, sectionId));

      return NextResponse.json({
        success: true,
        message: `Section ${
          !section.isActive ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (error) {
      console.error("Error toggling section status:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update status" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);
