// FILE: app/api/admin/rooms/bulk/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rooms, hospitalWings } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// POST create multiple rooms at once
export const POST = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const body = await request.json();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Validation
      if (!body.wingId || !body.startNumber || !body.endNumber) {
        return NextResponse.json(
          {
            success: false,
            error: "Wing ID, start number, and end number are required",
          },
          { status: 400 }
        );
      }

      const startNum = parseInt(body.startNumber);
      const endNum = parseInt(body.endNumber);

      if (startNum >= endNum) {
        return NextResponse.json(
          { success: false, error: "End number must be greater than start number" },
          { status: 400 }
        );
      }

      if (endNum - startNum > 100) {
        return NextResponse.json(
          { success: false, error: "Cannot create more than 100 rooms at once" },
          { status: 400 }
        );
      }

      // Verify wing belongs to admin's hospital
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
          { success: false, error: "Wing not found or access denied" },
          { status: 404 }
        );
      }

      // Generate rooms
      const newRooms = [];
      const prefix = body.prefix || "";

      for (let i = startNum; i <= endNum; i++) {
        newRooms.push({
          wingId: body.wingId,
          roomNumber: `${prefix}${i}`,
          roomNumberInt: i,
          roomType: body.roomType || "general",
          capacity: body.capacity || 1,
          status: "available",
          isActive: true,
        });
      }

      // Check for existing room numbers
      const roomNumbers = newRooms.map(r => r.roomNumber);
      const existingRooms = await db
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.wingId, body.wingId),
            isNull(rooms.deletedAt)
          )
        );

      const existingRoomNumbers = existingRooms.map(r => r.roomNumber);
      const duplicates = roomNumbers.filter(rn => existingRoomNumbers.includes(rn));

      if (duplicates.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Room numbers already exist: ${duplicates.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Insert all rooms
      await db.insert(rooms).values(newRooms);

      return NextResponse.json({
        success: true,
        message: `${newRooms.length} rooms created successfully`,
        count: newRooms.length,
      });
    } catch (error) {
      console.error("Error creating bulk rooms:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create rooms" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);