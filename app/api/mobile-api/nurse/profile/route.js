// FILE: app/api/mobile-api/nurse/profile/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nurses, hospitals, nursingSections, hospitalWings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET nurse profile
export const GET = withAuth(
  async (request, context, nurse) => {
    try {
      const db = await getDb();

      // Fetch complete nurse profile with hospital and section details
      const [profile] = await db
        .select({
          id: nurses.id,
          name: nurses.name,
          email: nurses.email,
          mobileNumber: nurses.mobileNumber,
          employeeId: nurses.employeeId,
          shiftTiming: nurses.shiftTiming,
          isActive: nurses.isActive,
          
          hospitalId: nurses.hospitalId,
          hospitalName: hospitals.name,
          hospitalAddress: hospitals.address,
          
          sectionId: nurses.sectionId,
          sectionName: nursingSections.sectionName,
          sectionDescription: nursingSections.description,
          
          wingId: nursingSections.wingId,
          wingName: hospitalWings.wingName,
        })
        .from(nurses)
        .leftJoin(hospitals, eq(nurses.hospitalId, hospitals.id))
        .leftJoin(nursingSections, eq(nurses.sectionId, nursingSections.id))
        .leftJoin(hospitalWings, eq(nursingSections.wingId, hospitalWings.id))
        .where(eq(nurses.id, nurse.id))
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
      console.error("Error fetching nurse profile:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch profile" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["nurse"] }
);