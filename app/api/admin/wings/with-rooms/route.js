// FILE: app/api/admin/wings/with-rooms/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitalWings, rooms } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all wings with their rooms
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

      // Fetch wings
      const wingsList = await db
        .select()
        .from(hospitalWings)
        .where(
          and(
            eq(hospitalWings.hospitalId, user.hospitalId),
            isNull(hospitalWings.deletedAt)
          )
        )
        .orderBy(hospitalWings.floorNumber, hospitalWings.wingName);

      // Fetch all rooms for these wings
      const wingIds = wingsList.map(w => w.id);
      
      let roomsList = [];
      if (wingIds.length > 0) {
        roomsList = await db
          .select()
          .from(rooms)
          .where(
            and(
              eq(rooms.wingId, wingIds[0]), // We'll filter in JS for multiple wings
              isNull(rooms.deletedAt)
            )
          )
          .orderBy(rooms.roomNumberInt, rooms.roomNumber);

        // If multiple wings, fetch all rooms
        if (wingIds.length > 1) {
          const allRooms = await db
            .select()
            .from(rooms)
            .where(isNull(rooms.deletedAt))
            .orderBy(rooms.roomNumberInt, rooms.roomNumber);
          
          roomsList = allRooms.filter(room => wingIds.includes(room.wingId));
        }
      }

      // Group rooms by wing
      const wingsWithRooms = wingsList.map(wing => ({
        ...wing,
        rooms: roomsList.filter(room => room.wingId === wing.id),
      }));

      return NextResponse.json({
        success: true,
        wings: wingsWithRooms,
        count: wingsWithRooms.length,
      });
    } catch (error) {
      console.error("Error fetching wings with rooms:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch wings with rooms" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);