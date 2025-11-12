// FILE: app/api/admin/security/[id]/toggle-status/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { securities } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// PATCH toggle security personnel active status
export const PATCH = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
                  const { id } = await context.params;

      const securityId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      const [security] = await db
        .select()
        .from(securities)
        .where(
          and(
            eq(securities.id, securityId),
            eq(securities.hospitalId, user.hospitalId),
            isNull(securities.deletedAt)
          )
        )
        .limit(1);

      if (!security) {
        return NextResponse.json(
          { success: false, error: "Security personnel not found" },
          { status: 404 }
        );
      }

      await db
        .update(securities)
        .set({
          isActive: !security.isActive,
          updatedAt: new Date(),
        })
        .where(eq(securities.id, securityId));

      return NextResponse.json({
        success: true,
        message: `Security personnel ${!security.isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling security status:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update status" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);