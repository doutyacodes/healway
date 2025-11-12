// FILE: app/api/admin/nurses/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nurses, nursingSections } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

// GET single nurse
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const nurseId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      const [nurse] = await db
        .select()
        .from(nurses)
        .where(
          and(
            eq(nurses.id, nurseId),
            eq(nurses.hospitalId, user.hospitalId),
            isNull(nurses.deletedAt)
          )
        )
        .limit(1);

      if (!nurse) {
        return NextResponse.json(
          { success: false, error: "Nurse not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        nurse,
      });
    } catch (error) {
      console.error("Error fetching nurse:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch nurse" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// PUT update nurse
export const PUT = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const nurseId = parseInt(id);
      const body = await request.json();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if nurse exists
      const [existingNurse] = await db
        .select()
        .from(nurses)
        .where(
          and(
            eq(nurses.id, nurseId),
            eq(nurses.hospitalId, user.hospitalId),
            isNull(nurses.deletedAt)
          )
        )
        .limit(1);

      if (!existingNurse) {
        return NextResponse.json(
          { success: false, error: "Nurse not found" },
          { status: 404 }
        );
      }

      // If email is being changed, check for duplicates
      if (body.email && body.email !== existingNurse.email) {
        const [duplicate] = await db
          .select()
          .from(nurses)
          .where(
            and(
              eq(nurses.hospitalId, user.hospitalId),
              eq(nurses.email, body.email),
              ne(nurses.id, nurseId),
              isNull(nurses.deletedAt)
            )
          )
          .limit(1);

        if (duplicate) {
          return NextResponse.json(
            { success: false, error: "A nurse with this email already exists" },
            { status: 400 }
          );
        }
      }

      // Verify section if being changed
      if (body.sectionId) {
        const [section] = await db
          .select()
          .from(nursingSections)
          .where(
            and(
              eq(nursingSections.id, body.sectionId),
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
      }

      // Prepare update data
      const updateData = {
        name: body.name || existingNurse.name,
        email: body.email !== undefined ? body.email : existingNurse.email,
        mobileNumber:
          body.mobileNumber !== undefined
            ? body.mobileNumber
            : existingNurse.mobileNumber,
        sectionId: body.sectionId || existingNurse.sectionId,
        employeeId:
          body.employeeId !== undefined
            ? body.employeeId
            : existingNurse.employeeId,
        shiftTiming:
          body.shiftTiming !== undefined
            ? body.shiftTiming
            : existingNurse.shiftTiming,
        updatedAt: new Date(),
      };

      // Hash new password if provided
      if (body.password) {
        if (body.password.length < 6) {
          return NextResponse.json(
            { success: false, error: "Password must be at least 6 characters" },
            { status: 400 }
          );
        }
        updateData.password = await bcrypt.hash(body.password, 10);
      }

      // Update nurse
      await db.update(nurses).set(updateData).where(eq(nurses.id, nurseId));

      return NextResponse.json({
        success: true,
        message: "Nurse updated successfully",
      });
    } catch (error) {
      console.error("Error updating nurse:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update nurse" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// DELETE nurse (soft delete)
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const nurseId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if nurse exists
      const [existingNurse] = await db
        .select()
        .from(nurses)
        .where(
          and(
            eq(nurses.id, nurseId),
            eq(nurses.hospitalId, user.hospitalId),
            isNull(nurses.deletedAt)
          )
        )
        .limit(1);

      if (!existingNurse) {
        return NextResponse.json(
          { success: false, error: "Nurse not found" },
          { status: 404 }
        );
      }

      // Soft delete
      await db
        .update(nurses)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(nurses.id, nurseId));

      return NextResponse.json({
        success: true,
        message: "Nurse deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting nurse:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete nurse" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);
