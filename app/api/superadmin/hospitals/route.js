// FILE: app/api/superadmin/hospitals/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitals, superAdmins } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all hospitals
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();

      // Only super admins can view all hospitals
      const allHospitals = await db
        .select({
          id: hospitals.id,
          name: hospitals.name,
          imageUrl: hospitals.imageUrl,
          address: hospitals.address,
          district: hospitals.district,
          state: hospitals.state,
          country: hospitals.country,
          pincode: hospitals.pincode,
          contactEmail: hospitals.contactEmail,
          contactPhone: hospitals.contactPhone,
          isActive: hospitals.isActive,
          createdAt: hospitals.createdAt,
          updatedAt: hospitals.updatedAt,
          createdByName: superAdmins.name,
        })
        .from(hospitals)
        .leftJoin(
          superAdmins,
          eq(hospitals.createdBySuperAdminId, superAdmins.id)
        )
        .where(isNull(hospitals.deletedAt))
        .orderBy(hospitals.createdAt);

      return NextResponse.json({
        success: true,
        hospitals: allHospitals,
        count: allHospitals.length,
      });
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch hospitals" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);

// POST create new hospital
export const POST = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const body = await request.json();

      // Validation
      if (!body.name || !body.address) {
        return NextResponse.json(
          {
            success: false,
            error: "Hospital name and address are required",
          },
          { status: 400 }
        );
      }

      // Insert hospital
      const [newHospital] = await db
        .insert(hospitals)
        .values({
          name: body.name,
          imageUrl: body.imageUrl || null,
          address: body.address,
          district: body.district || null,
          state: body.state || null,
          country: body.country || "India",
          pincode: body.pincode || null,
          contactEmail: body.contactEmail || null,
          contactPhone: body.contactPhone || null,
          createdBySuperAdminId: user.id,
          isActive: true,
        });

      return NextResponse.json({
        success: true,
        message: "Hospital created successfully",
        hospital: newHospital,
      });
    } catch (error) {
      console.error("Error creating hospital:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create hospital" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);