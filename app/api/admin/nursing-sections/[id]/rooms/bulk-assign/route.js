// FILE: app/api/admin/nursing-sections/[id]/rooms/bulk-assign/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nursingSectionRooms, nursingSections, rooms } from "@/lib/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// POST bulk assign multiple rooms to section
export const POST = withAuth(
  async (request, context, user) => {
    try {
      const { id } = await context.params;
const sectionId = parseInt(id);
      const body = await request.json();
      const { roomIds } = body;

      if (!Array.isArray(roomIds) || roomIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "Room IDs array is required" },
          { status: 400 }
        );
      }

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

      // Verify all rooms exist and are active
      const validRooms = await db
        .select()
        .from(rooms)
        .where(
          and(
            inArray(rooms.id, roomIds),
            eq(rooms.isActive, true),
            isNull(rooms.deletedAt)
          )
        );

      if (validRooms.length !== roomIds.length) {
        return NextResponse.json(
          { success: false, error: "Some rooms not found or inactive" },
          { status: 404 }
        );
      }

      // Get already assigned rooms
      const existingAssignments = await db
        .select()
        .from(nursingSectionRooms)
        .where(
          and(
            eq(nursingSectionRooms.sectionId, sectionId),
            inArray(nursingSectionRooms.roomId, roomIds)
          )
        );

      const existingRoomIds = existingAssignments.map((a) => a.roomId);
      const newRoomIds = roomIds.filter((id) => !existingRoomIds.includes(id));

      // Bulk insert new assignments
      if (newRoomIds.length > 0) {
        const values = newRoomIds.map((roomId) => ({
          sectionId,
          roomId,
        }));

        await db.insert(nursingSectionRooms).values(values);
      }

      return NextResponse.json({
        success: true,
        message: "Rooms assigned to section successfully",
        stats: {
          total: roomIds.length,
          newlyAssigned: newRoomIds.length,
          alreadyAssigned: existingRoomIds.length,
        },
      });
    } catch (error) {
      console.error("Error bulk assigning rooms:", error);
      return NextResponse.json(
        { success: false, error: "Failed to assign rooms to section" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);