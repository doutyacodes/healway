// FILE: app/api/admin/rooms/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rooms, hospitalWings } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET single room
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const roomId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      const [room] = await db
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
          hospitalId: hospitalWings.hospitalId,
        })
        .from(rooms)
        .leftJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
        .where(and(eq(rooms.id, roomId), isNull(rooms.deletedAt)))
        .limit(1);

      if (!room) {
        return NextResponse.json(
          { success: false, error: "Room not found" },
          { status: 404 }
        );
      }

      // Verify room belongs to admin's hospital
      if (room.hospitalId !== user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        room,
      });
    } catch (error) {
      console.error("Error fetching room:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch room" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// PUT update room
export const PUT = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const roomId = parseInt(id);
      const body = await request.json();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if room exists and get its wing
      const [existingRoom] = await db
        .select({
          id: rooms.id,
          wingId: rooms.wingId,
          roomNumber: rooms.roomNumber,
          hospitalId: hospitalWings.hospitalId,
        })
        .from(rooms)
        .leftJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
        .where(and(eq(rooms.id, roomId), isNull(rooms.deletedAt)))
        .limit(1);

      if (!existingRoom) {
        return NextResponse.json(
          { success: false, error: "Room not found" },
          { status: 404 }
        );
      }

      // Verify room belongs to admin's hospital
      if (existingRoom.hospitalId !== user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      // If room number is being changed, check for duplicates
      if (body.roomNumber && body.roomNumber !== existingRoom.roomNumber) {
        const [duplicate] = await db
          .select()
          .from(rooms)
          .where(
            and(
              eq(rooms.wingId, existingRoom.wingId),
              eq(rooms.roomNumber, body.roomNumber),
              ne(rooms.id, roomId),
              isNull(rooms.deletedAt)
            )
          )
          .limit(1);

        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              error: "Room number already exists in this wing",
            },
            { status: 400 }
          );
        }
      }

      // Update room
      await db
        .update(rooms)
        .set({
          roomNumber: body.roomNumber || existingRoom.roomNumber,
          roomNumberInt:
            body.roomNumberInt !== undefined ? body.roomNumberInt : undefined,
          roomType: body.roomType || undefined,
          capacity: body.capacity !== undefined ? body.capacity : undefined,
          status: body.status || undefined,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, roomId));

      // Fetch updated room
      const [updatedRoom] = await db
        .select()
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .limit(1);

      return NextResponse.json({
        success: true,
        message: "Room updated successfully",
        room: updatedRoom,
      });
    } catch (error) {
      console.error("Error updating room:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update room" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// DELETE room (soft delete)
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const roomId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if room exists
      const [existingRoom] = await db
        .select({
          id: rooms.id,
          status: rooms.status,
          hospitalId: hospitalWings.hospitalId,
        })
        .from(rooms)
        .leftJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
        .where(and(eq(rooms.id, roomId), isNull(rooms.deletedAt)))
        .limit(1);

      if (!existingRoom) {
        return NextResponse.json(
          { success: false, error: "Room not found" },
          { status: 404 }
        );
      }

      // Verify room belongs to admin's hospital
      if (existingRoom.hospitalId !== user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      // Check if room is occupied
      if (existingRoom.status === "occupied") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot delete an occupied room. Please discharge the patient first.",
          },
          { status: 400 }
        );
      }

      // Soft delete - set deletedAt timestamp
      await db
        .update(rooms)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, roomId));

      return NextResponse.json({
        success: true,
        message: "Room deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting room:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete room" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);
