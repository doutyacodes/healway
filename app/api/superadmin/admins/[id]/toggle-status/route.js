// FILE: app/api/superadmin/admins/[id]/toggle-status/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitalAdmins } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// PATCH toggle admin active status
export const PATCH = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
                  const { id } = await context.params;

      const adminId = parseInt(id);

      // Check if admin exists
      const [existingAdmin] = await db
        .select()
        .from(hospitalAdmins)
        .where(
          and(
            eq(hospitalAdmins.id, adminId),
            isNull(hospitalAdmins.deletedAt)
          )
        )
        .limit(1);

      if (!existingAdmin) {
        return NextResponse.json(
          { success: false, error: "Admin not found" },
          { status: 404 }
        );
      }

      // Toggle status
      const newStatus = !existingAdmin.isActive;

      await db
        .update(hospitalAdmins)
        .set({
          isActive: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(hospitalAdmins.id, adminId));

      return NextResponse.json({
        success: true,
        message: `Admin ${newStatus ? 'activated' : 'deactivated'} successfully`,
        isActive: newStatus,
      });
    } catch (error) {
      console.error("Error toggling admin status:", error);
      return NextResponse.json(
        { success: false, error: "Failed to toggle admin status" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);