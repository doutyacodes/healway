// FILE: app/api/superadmin/admins/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitalAdmins, hospitals } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

// GET single admin
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const adminId = parseInt(context.params.id);

      const [admin] = await db
        .select({
          id: hospitalAdmins.id,
          hospitalId: hospitalAdmins.hospitalId,
          name: hospitalAdmins.name,
          email: hospitalAdmins.email,
          mobileNumber: hospitalAdmins.mobileNumber,
          role: hospitalAdmins.role,
          isActive: hospitalAdmins.isActive,
          createdAt: hospitalAdmins.createdAt,
          hospitalName: hospitals.name,
        })
        .from(hospitalAdmins)
        .leftJoin(hospitals, eq(hospitalAdmins.hospitalId, hospitals.id))
        .where(
          and(
            eq(hospitalAdmins.id, adminId),
            isNull(hospitalAdmins.deletedAt)
          )
        )
        .limit(1);

      if (!admin) {
        return NextResponse.json(
          { success: false, error: "Admin not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        admin,
      });
    } catch (error) {
      console.error("Error fetching admin:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch admin" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);

// PUT update admin
export const PUT = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const adminId = parseInt(context.params.id);
      const body = await request.json();

      // Check if admin exists
      const [existingAdmin] = await db
        .select()
        .from(hospitalAdmins)
        .where(
          and(
            eq(hospitalAdmins.id, adminId),
            isNull(hospitalAdmins.deletedAt)
          )
        )
        .limit(1);

      if (!existingAdmin) {
        return NextResponse.json(
          { success: false, error: "Admin not found" },
          { status: 404 }
        );
      }

      // Check if email is being changed and if it already exists
      if (body.email && body.email !== existingAdmin.email) {
        const [emailExists] = await db
          .select()
          .from(hospitalAdmins)
          .where(
            and(
              eq(hospitalAdmins.email, body.email),
              ne(hospitalAdmins.id, adminId)
            )
          )
          .limit(1);

        if (emailExists) {
          return NextResponse.json(
            {
              success: false,
              error: "An admin with this email already exists",
            },
            { status: 400 }
          );
        }
      }

      // Prepare update object
      const updateData = {
        name: body.name || existingAdmin.name,
        email: body.email || existingAdmin.email,
        mobileNumber: body.mobileNumber !== undefined ? body.mobileNumber : existingAdmin.mobileNumber,
        role: body.role || existingAdmin.role,
        updatedAt: new Date(),
      };

      // If hospitalId is being changed, verify the new hospital exists
      if (body.hospitalId && body.hospitalId !== existingAdmin.hospitalId) {
        const [hospital] = await db
          .select()
          .from(hospitals)
          .where(
            and(
              eq(hospitals.id, body.hospitalId),
              eq(hospitals.isActive, true),
              isNull(hospitals.deletedAt)
            )
          )
          .limit(1);

        if (!hospital) {
          return NextResponse.json(
            { success: false, error: "Hospital not found or inactive" },
            { status: 404 }
          );
        }

        updateData.hospitalId = body.hospitalId;
      }

      // If password is provided, hash it
      if (body.password && body.password.length > 0) {
        if (body.password.length < 6) {
          return NextResponse.json(
            { success: false, error: "Password must be at least 6 characters" },
            { status: 400 }
          );
        }
        updateData.password = await bcrypt.hash(body.password, 10);
        updateData.passwordChangedAt = new Date();
      }

      // Update admin
      await db
        .update(hospitalAdmins)
        .set(updateData)
        .where(eq(hospitalAdmins.id, adminId));

      // Fetch updated admin
      const [updatedAdmin] = await db
        .select({
          id: hospitalAdmins.id,
          hospitalId: hospitalAdmins.hospitalId,
          name: hospitalAdmins.name,
          email: hospitalAdmins.email,
          mobileNumber: hospitalAdmins.mobileNumber,
          role: hospitalAdmins.role,
          isActive: hospitalAdmins.isActive,
          hospitalName: hospitals.name,
        })
        .from(hospitalAdmins)
        .leftJoin(hospitals, eq(hospitalAdmins.hospitalId, hospitals.id))
        .where(eq(hospitalAdmins.id, adminId))
        .limit(1);

      return NextResponse.json({
        success: true,
        message: "Admin updated successfully",
        admin: updatedAdmin,
      });
    } catch (error) {
      console.error("Error updating admin:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update admin" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);

// DELETE admin (soft delete)
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const adminId = parseInt(context.params.id);

      // Check if admin exists
      const [existingAdmin] = await db
        .select()
        .from(hospitalAdmins)
        .where(
          and(
            eq(hospitalAdmins.id, adminId),
            isNull(hospitalAdmins.deletedAt)
          )
        )
        .limit(1);

      if (!existingAdmin) {
        return NextResponse.json(
          { success: false, error: "Admin not found" },
          { status: 404 }
        );
      }

      // Soft delete - set deletedAt timestamp
      await db
        .update(hospitalAdmins)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(hospitalAdmins.id, adminId));

      return NextResponse.json({
        success: true,
        message: "Admin deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting admin:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete admin" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);