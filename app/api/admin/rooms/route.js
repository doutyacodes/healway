// FILE: app/api/admin/rooms/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rooms, hospitalWings } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all rooms for admin's hospital
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

      // Get wing IDs for this hospital
      const wingsList = await db
        .select({ id: hospitalWings.id })
        .from(hospitalWings)
        .where(
          and(
            eq(hospitalWings.hospitalId, user.hospitalId),
            isNull(hospitalWings.deletedAt)
          )
        );

      const wingIds = wingsList.map(w => w.id);

      if (wingIds.length === 0) {
        return NextResponse.json({
          success: true,
          rooms: [],
          count: 0,
        });
      }

      // Fetch rooms
      const roomsList = await db
        .select({
          id: rooms.id,
          wingId: rooms.wingId,
          roomNumber: rooms.roomNumber,
          roomNumberInt: rooms.roomNumberInt,
          roomType: rooms.roomType,
          capacity: rooms.capacity,
          status: rooms.status,
          isActive: rooms.isActive,
          createdAt: rooms.createdAt,
          wingName: hospitalWings.wingName,
        })
        .from(rooms)
        .leftJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
        .where(isNull(rooms.deletedAt))
        .orderBy(rooms.wingId, rooms.roomNumberInt, rooms.roomNumber);

      // Filter rooms that belong to this hospital's wings
      const filteredRooms = roomsList.filter(room => 
        wingIds.includes(room.wingId)
      );

      return NextResponse.json({
        success: true,
        rooms: filteredRooms,
        count: filteredRooms.length,
      });
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch rooms" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// POST create new room
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
      if (!body.wingId || !body.roomNumber) {
        return NextResponse.json(
          { success: false, error: "Wing and room number are required" },
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

      // Check if room number already exists in this wing
      const [existingRoom] = await db
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.wingId, body.wingId),
            eq(rooms.roomNumber, body.roomNumber),
            isNull(rooms.deletedAt)
          )
        )
        .limit(1);

      if (existingRoom) {
        return NextResponse.json(
          { success: false, error: "Room number already exists in this wing" },
          { status: 400 }
        );
      }

      // Insert room
      const [newRoom] = await db
        .insert(rooms)
        .values({
          wingId: body.wingId,
          roomNumber: body.roomNumber,
          roomNumberInt: body.roomNumberInt || null,
          roomType: body.roomType || "general",
          capacity: body.capacity || 1,
          status: body.status || "available",
          isActive: true,
        });

      return NextResponse.json({
        success: true,
        message: "Room created successfully",
        room: {
          id: newRoom.insertId,
          ...body,
        },
      });
    } catch (error) {
      console.error("Error creating room:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create room" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);