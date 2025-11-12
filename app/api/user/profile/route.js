// FILE: app/api/user/profile/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  users,
  patientSessions,
  hospitalWings,
  rooms,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET user profile with active session
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();

      // Get user details
      const [userDetails] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, user.id),
            isNull(users.deletedAt)
          )
        )
        .limit(1);

      if (!userDetails) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Get active session
      const [activeSession] = await db
        .select({
          id: patientSessions.id,
          startDate: patientSessions.startDate,
          admissionType: patientSessions.admissionType,
          notes: patientSessions.notes,
          wingId: patientSessions.wingId,
          wingName: hospitalWings.wingName,
          roomId: patientSessions.roomId,
          roomNumber: rooms.roomNumber,
          roomType: rooms.roomType,
        })
        .from(patientSessions)
        .leftJoin(hospitalWings, eq(patientSessions.wingId, hospitalWings.id))
        .leftJoin(rooms, eq(patientSessions.roomId, rooms.id))
        .where(
          and(
            eq(patientSessions.userId, user.id),
            eq(patientSessions.status, "active")
          )
        )
        .limit(1);

      return NextResponse.json({
        success: true,
        user: {
          id: userDetails.id,
          name: userDetails.name,
          email: userDetails.email,
          mobileNumber: userDetails.mobileNumber,
          role: userDetails.role,
          isActive: userDetails.isActive,
        },
        session: activeSession || null,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch profile" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["user"] }
);