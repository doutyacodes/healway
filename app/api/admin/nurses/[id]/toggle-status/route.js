// FILE: app/api/admin/nurses/[id]/toggle-status/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nurses } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// PATCH toggle nurse active status
export const PATCH = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const nurseId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      const [nurse] = await db
        .select()
        .from(nurses)
        .where(
          and(
            eq(nurses.id, nurseId),
            eq(nurses.hospitalId, user.hospitalId),
            isNull(nurses.deletedAt)
          )
        )
        .limit(1);

      if (!nurse) {
        return NextResponse.json(
          { success: false, error: "Nurse not found" },
          { status: 404 }
        );
      }

      await db
        .update(nurses)
        .set({
          isActive: !nurse.isActive,
          updatedAt: new Date(),
        })
        .where(eq(nurses.id, nurseId));

      return NextResponse.json({
        success: true,
        message: `Nurse ${
          !nurse.isActive ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (error) {
      console.error("Error toggling nurse status:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update status" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);
