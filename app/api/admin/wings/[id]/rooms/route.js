// FILE: app/api/admin/wings/[id]/rooms/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rooms, hospitalWings } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all rooms for a specific wing
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();

      // ✅ FIX: unwrap params properly (Next.js 15+ change)
      const { id } = await context.params;
      const wingId = parseInt(id);

      if (isNaN(wingId)) {
        return NextResponse.json(
          { success: false, error: "Invalid wing ID" },
          { status: 400 }
        );
      }

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // ✅ Verify wing belongs to admin's hospital
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
          { success: false, error: "Wing not found or access denied" },
          { status: 404 }
        );
      }

      // ✅ Fetch rooms for this wing
      const roomsList = await db
        .select()
        .from(rooms)
        .where(and(eq(rooms.wingId, wingId), isNull(rooms.deletedAt)))
        .orderBy(rooms.roomNumberInt, rooms.roomNumber);

      return NextResponse.json({
        success: true,
        rooms: roomsList,
        count: roomsList.length,
        wing: {
          id: wing.id,
          name: wing.wingName,
          code: wing.wingCode,
        },
      });
    } catch (error) {
      console.error("Error fetching rooms by wing:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch rooms" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);
