// FILE: app/api/admin/sessions/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  patientSessions,
  users,
  hospitalWings,
  rooms,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// POST create new patient session (admission)
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
      if (!body.userId || !body.wingId || !body.roomId) {
        return NextResponse.json(
          { success: false, error: "User, wing, and room are required" },
          { status: 400 }
        );
      }

      // Verify patient exists and belongs to this hospital
      const [patient] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, body.userId),
            eq(users.hospitalId, user.hospitalId),
            isNull(users.deletedAt)
          )
        )
        .limit(1);

      if (!patient) {
        return NextResponse.json(
          { success: false, error: "Patient not found" },
          { status: 404 }
        );
      }

      // Check if patient already has an active session
      const [existingSession] = await db
        .select()
        .from(patientSessions)
        .where(
          and(
            eq(patientSessions.userId, body.userId),
            eq(patientSessions.status, "active")
          )
        )
        .limit(1);

      if (existingSession) {
        return NextResponse.json(
          {
            success: false,
            error: "Patient already has an active session",
          },
          { status: 400 }
        );
      }

      // Verify wing belongs to this hospital
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
          { success: false, error: "Wing not found" },
          { status: 404 }
        );
      }

      // Verify room exists and is available
      const [room] = await db
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.id, body.roomId),
            eq(rooms.wingId, body.wingId),
            isNull(rooms.deletedAt)
          )
        )
        .limit(1);

      if (!room) {
        return NextResponse.json(
          { success: false, error: "Room not found" },
          { status: 404 }
        );
      }

      if (room.status !== "available") {
        return NextResponse.json(
          {
            success: false,
            error: `Room is not available (Status: ${room.status})`,
          },
          { status: 400 }
        );
      }

      // Create session
      const [newSession] = await db
        .insert(patientSessions)
        .values({
          userId: body.userId,
          hospitalId: user.hospitalId,
          wingId: body.wingId,
          roomId: body.roomId,
          admittedByAdminId: user.id,
          startDate: new Date(),
          admissionType: body.admissionType || "planned",
          status: "active",
          notes: body.notes || null,
        });

      // Update room status to occupied
      await db
        .update(rooms)
        .set({
          status: "occupied",
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, body.roomId));

      return NextResponse.json({
        success: true,
        message: "Patient admitted successfully",
        session: {
          id: newSession.insertId,
          userId: body.userId,
          roomId: body.roomId,
          wingId: body.wingId,
        },
      });
    } catch (error) {
      console.error("Error creating session:", error);
      return NextResponse.json(
        { success: false, error: "Failed to admit patient" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);