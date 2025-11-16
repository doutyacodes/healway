// FILE: app/api/admin/nursing-sections/[id]/rooms/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  nursingSectionRooms,
  rooms,
  hospitalWings,
  nursingSections,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all rooms assigned to a nursing section
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const { id } = await context.params;
const sectionId = parseInt(id);
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

      // Get assigned rooms
      const assignedRooms = await db
        .select({
          assignmentId: nursingSectionRooms.id,
          roomId: rooms.id,
          roomNumber: rooms.roomNumber,
          roomNumberInt: rooms.roomNumberInt,
          roomType: rooms.roomType,
          capacity: rooms.capacity,
          status: rooms.status,
          wingId: hospitalWings.id,
          wingName: hospitalWings.wingName,
          assignedAt: nursingSectionRooms.assignedAt,
        })
        .from(nursingSectionRooms)
        .innerJoin(rooms, eq(nursingSectionRooms.roomId, rooms.id))
        .leftJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
        .where(
          and(
            eq(nursingSectionRooms.sectionId, sectionId),
            isNull(rooms.deletedAt)
          )
        )
        .orderBy(rooms.roomNumberInt, rooms.roomNumber);

      // Get available rooms (not assigned to this section)
      const availableRooms = await db
        .select({
          roomId: rooms.id,
          roomNumber: rooms.roomNumber,
          roomNumberInt: rooms.roomNumberInt,
          roomType: rooms.roomType,
          capacity: rooms.capacity,
          status: rooms.status,
          wingId: hospitalWings.id,
          wingName: hospitalWings.wingName,
        })
        .from(rooms)
        .leftJoin(hospitalWings, eq(rooms.wingId, hospitalWings.id))
        .leftJoin(
          nursingSectionRooms,
          and(
            eq(nursingSectionRooms.roomId, rooms.id),
            eq(nursingSectionRooms.sectionId, sectionId)
          )
        )
        .where(
          and(
            eq(rooms.isActive, true),
            isNull(rooms.deletedAt),
            isNull(nursingSectionRooms.id) // Not already assigned
          )
        )
        .orderBy(rooms.roomNumberInt, rooms.roomNumber);

      return NextResponse.json({
        success: true,
        section: {
          id: section.id,
          sectionName: section.sectionName,
          wingId: section.wingId,
        },
        assignedRooms,
        availableRooms,
        stats: {
          assignedCount: assignedRooms.length,
          availableCount: availableRooms.length,
        },
      });
    } catch (error) {
      console.error("Error fetching section rooms:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch section rooms" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// POST assign room to section
export const POST = withAuth(
  async (request, context, user) => {
    try {
      const { id } = await context.params;
const sectionId = parseInt(id);
      const body = await request.json();
      const { roomId } = body;

      if (!roomId) {
        return NextResponse.json(
          { success: false, error: "Room ID is required" },
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

      // Verify room exists and is active
      const [room] = await db
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.id, roomId),
            eq(rooms.isActive, true),
            isNull(rooms.deletedAt)
          )
        )
        .limit(1);

      if (!room) {
        return NextResponse.json(
          { success: false, error: "Room not found or inactive" },
          { status: 404 }
        );
      }

      // Check if already assigned
      const [existing] = await db
        .select()
        .from(nursingSectionRooms)
        .where(
          and(
            eq(nursingSectionRooms.sectionId, sectionId),
            eq(nursingSectionRooms.roomId, roomId)
          )
        )
        .limit(1);

      if (existing) {
        return NextResponse.json(
          { success: false, error: "Room is already assigned to this section" },
          { status: 400 }
        );
      }

      // Assign room to section
      await db.insert(nursingSectionRooms).values({
        sectionId,
        roomId,
      });

      return NextResponse.json({
        success: true,
        message: "Room assigned to section successfully",
      });
    } catch (error) {
      console.error("Error assigning room to section:", error);
      return NextResponse.json(
        { success: false, error: "Failed to assign room to section" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);