// FILE: app/api/admin/security/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { securities, hospitalWings } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

// GET single security personnel
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
                  const { id } = await context.params;

      const securityId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      const [security] = await db
        .select()
        .from(securities)
        .where(
          and(
            eq(securities.id, securityId),
            eq(securities.hospitalId, user.hospitalId),
            isNull(securities.deletedAt)
          )
        )
        .limit(1);

      if (!security) {
        return NextResponse.json(
          { success: false, error: "Security personnel not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        security,
      });
    } catch (error) {
      console.error("Error fetching security personnel:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch security personnel" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// PUT update security personnel
export const PUT = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
                  const { id } = await context.params;

      const securityId = parseInt(id);
      const body = await request.json();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if security personnel exists
      const [existing] = await db
        .select()
        .from(securities)
        .where(
          and(
            eq(securities.id, securityId),
            eq(securities.hospitalId, user.hospitalId),
            isNull(securities.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Security personnel not found" },
          { status: 404 }
        );
      }

      // If username is being changed, check for duplicates
      if (body.username && body.username !== existing.username) {
        const [duplicate] = await db
          .select()
          .from(securities)
          .where(
            and(
              eq(securities.hospitalId, user.hospitalId),
              eq(securities.username, body.username),
              ne(securities.id, securityId),
              isNull(securities.deletedAt)
            )
          )
          .limit(1);

        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              error: "A security person with this username already exists",
            },
            { status: 400 }
          );
        }
      }

      // Verify wing if being changed
      if (body.assignedWingId) {
        const [wing] = await db
          .select()
          .from(hospitalWings)
          .where(
            and(
              eq(hospitalWings.id, body.assignedWingId),
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
      }

      // Prepare update data
      const updateData = {
        name: body.name || existing.name,
        username:
          body.username !== undefined ? body.username : existing.username,
        mobileNumber:
          body.mobileNumber !== undefined
            ? body.mobileNumber
            : existing.mobileNumber,
        assignedWingId: body.assignedWingId || existing.assignedWingId,
        employeeId:
          body.employeeId !== undefined ? body.employeeId : existing.employeeId,
        shiftTiming:
          body.shiftTiming !== undefined
            ? body.shiftTiming
            : existing.shiftTiming,
        photoUrl:
          body.photoUrl !== undefined ? body.photoUrl : existing.photoUrl,
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

      // Update security personnel
      await db
        .update(securities)
        .set(updateData)
        .where(eq(securities.id, securityId));

      return NextResponse.json({
        success: true,
        message: "Security personnel updated successfully",
      });
    } catch (error) {
      console.error("Error updating security personnel:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update security personnel" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// DELETE security personnel (soft delete)
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
                  const { id } = await context.params;

      const securityId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if security personnel exists
      const [existing] = await db
        .select()
        .from(securities)
        .where(
          and(
            eq(securities.id, securityId),
            eq(securities.hospitalId, user.hospitalId),
            isNull(securities.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Security personnel not found" },
          { status: 404 }
        );
      }

      // Soft delete
      await db
        .update(securities)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(securities.id, securityId));

      return NextResponse.json({
        success: true,
        message: "Security personnel deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting security personnel:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete security personnel" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);