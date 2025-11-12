// FILE: app/api/admin/staff/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  nurses,
  securities,
  nursingSections,
  hospitalWings,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all staff (nurses and security) for admin's hospital
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

      // Fetch nurses
      const nursesList = await db
        .select({
          id: nurses.id,
          sectionId: nurses.sectionId,
          sectionName: nursingSections.sectionName,
          wingId: nursingSections.wingId,
          wingName: hospitalWings.wingName,
          name: nurses.name,
          email: nurses.email,
          mobileNumber: nurses.mobileNumber,
          employeeId: nurses.employeeId,
          shiftTiming: nurses.shiftTiming,
          isActive: nurses.isActive,
          createdAt: nurses.createdAt,
        })
        .from(nurses)
        .leftJoin(nursingSections, eq(nurses.sectionId, nursingSections.id))
        .leftJoin(hospitalWings, eq(nursingSections.wingId, hospitalWings.id))
        .where(
          and(
            eq(nurses.hospitalId, user.hospitalId),
            isNull(nurses.deletedAt)
          )
        );

      // Fetch security
      const securityList = await db
        .select({
          id: securities.id,
          assignedWingId: securities.assignedWingId,
          assignedWingName: hospitalWings.wingName,
          name: securities.name,
          username: securities.username,
          mobileNumber: securities.mobileNumber,
          employeeId: securities.employeeId,
          shiftTiming: securities.shiftTiming,
          photoUrl: securities.photoUrl,
          isActive: securities.isActive,
          createdAt: securities.createdAt,
        })
        .from(securities)
        .leftJoin(
          hospitalWings,
          eq(securities.assignedWingId, hospitalWings.id)
        )
        .where(
          and(
            eq(securities.hospitalId, user.hospitalId),
            isNull(securities.deletedAt)
          )
        );

      // Combine and format data
      const allStaff = [
        ...nursesList.map((nurse) => ({ ...nurse, type: "nurse" })),
        ...securityList.map((security) => ({ ...security, type: "security" })),
      ];

      // Sort by creation date
      allStaff.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return NextResponse.json({
        success: true,
        staff: allStaff,
        count: allStaff.length,
      });
    } catch (error) {
      console.error("Error fetching staff:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch staff" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);