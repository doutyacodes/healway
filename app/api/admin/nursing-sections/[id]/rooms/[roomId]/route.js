// FILE: app/api/admin/nursing-sections/[id]/rooms/[roomId]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nursingSectionRooms, nursingSections } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// DELETE remove room from section
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
            const {id} = parseInt(context.params)
      const sectionId = parseInt(id);

      const { roomId } = await context.params;
const parsedRoomId = parseInt(roomId);

      const db = await getDb();

      // Verify section belongs to admin's hospital
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

      // Remove assignment
      const result = await db
        .delete(nursingSectionRooms)
        .where(
          and(
            eq(nursingSectionRooms.sectionId, sectionId),
            eq(nursingSectionRooms.roomId, parsedRoomId)
          )
        );

      return NextResponse.json({
        success: true,
        message: "Room removed from section successfully",
      });
    } catch (error) {
      console.error("Error removing room from section:", error);
      return NextResponse.json(
        { success: false, error: "Failed to remove room from section" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);