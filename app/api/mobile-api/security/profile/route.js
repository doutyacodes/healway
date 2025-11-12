// FILE: app/api/mobile-api/security/profile/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { securities, hospitals, hospitalWings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET security profile
export const GET = withAuth(
  async (request, context, security) => {
    try {
      const db = await getDb();

      // Fetch complete security profile with hospital and wing details
      const [profile] = await db
        .select({
          id: securities.id,
          name: securities.name,
          username: securities.username,
          mobileNumber: securities.mobileNumber,
          employeeId: securities.employeeId,
          shiftTiming: securities.shiftTiming,
          photoUrl: securities.photoUrl,
          isActive: securities.isActive,
          
          hospitalId: securities.hospitalId,
          hospitalName: hospitals.name,
          hospitalAddress: hospitals.address,
          
          assignedWingId: securities.assignedWingId,
          wingName: hospitalWings.wingName,
          wingCode: hospitalWings.wingCode,
          floorNumber: hospitalWings.floorNumber,
        })
        .from(securities)
        .leftJoin(hospitals, eq(securities.hospitalId, hospitals.id))
        .leftJoin(hospitalWings, eq(securities.assignedWingId, hospitalWings.id))
        .where(eq(securities.id, security.id))
        .limit(1);

      if (!profile) {
        return NextResponse.json(
          { success: false, error: "Profile not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        profile,
      });
    } catch (error) {
      console.error("Error fetching security profile:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch profile" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["security"] }
);