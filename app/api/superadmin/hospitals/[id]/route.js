// FILE: app/api/superadmin/hospitals/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitals } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET single hospital
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const hospitalId = parseInt(id);

      const [hospital] = await db
        .select()
        .from(hospitals)
        .where(and(eq(hospitals.id, hospitalId), isNull(hospitals.deletedAt)))
        .limit(1);

      if (!hospital) {
        return NextResponse.json(
          { success: false, error: "Hospital not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        hospital,
      });
    } catch (error) {
      console.error("Error fetching hospital:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch hospital" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);

// PUT update hospital
export const PUT = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const hospitalId = parseInt(id);
      const body = await request.json();

      // Check if hospital exists
      const [existingHospital] = await db
        .select()
        .from(hospitals)
        .where(and(eq(hospitals.id, hospitalId), isNull(hospitals.deletedAt)))
        .limit(1);

      if (!existingHospital) {
        return NextResponse.json(
          { success: false, error: "Hospital not found" },
          { status: 404 }
        );
      }

      // Update hospital
      await db
        .update(hospitals)
        .set({
          name: body.name || existingHospital.name,
          imageUrl:
            body.imageUrl !== undefined
              ? body.imageUrl
              : existingHospital.imageUrl,
          address: body.address || existingHospital.address,
          district:
            body.district !== undefined
              ? body.district
              : existingHospital.district,
          state: body.state !== undefined ? body.state : existingHospital.state,
          country: body.country || existingHospital.country,
          pincode:
            body.pincode !== undefined
              ? body.pincode
              : existingHospital.pincode,
          contactEmail:
            body.contactEmail !== undefined
              ? body.contactEmail
              : existingHospital.contactEmail,
          contactPhone:
            body.contactPhone !== undefined
              ? body.contactPhone
              : existingHospital.contactPhone,
          updatedAt: new Date(),
        })
        .where(eq(hospitals.id, hospitalId));

      // Fetch updated hospital
      const [updatedHospital] = await db
        .select()
        .from(hospitals)
        .where(eq(hospitals.id, hospitalId))
        .limit(1);

      return NextResponse.json({
        success: true,
        message: "Hospital updated successfully",
        hospital: updatedHospital,
      });
    } catch (error) {
      console.error("Error updating hospital:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update hospital" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);

// DELETE hospital (soft delete)
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const hospitalId = parseInt(id);

      // Check if hospital exists
      const [existingHospital] = await db
        .select()
        .from(hospitals)
        .where(and(eq(hospitals.id, hospitalId), isNull(hospitals.deletedAt)))
        .limit(1);

      if (!existingHospital) {
        return NextResponse.json(
          { success: false, error: "Hospital not found" },
          { status: 404 }
        );
      }

      // Soft delete - set deletedAt timestamp
      await db
        .update(hospitals)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(hospitals.id, hospitalId));

      return NextResponse.json({
        success: true,
        message: "Hospital deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting hospital:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete hospital" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);
