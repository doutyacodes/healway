// FILE: app/api/superadmin/admins/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitalAdmins, hospitals } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

// GET all hospital admins
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();

      // Fetch all admins with hospital details
      const allAdmins = await db
        .select({
          id: hospitalAdmins.id,
          hospitalId: hospitalAdmins.hospitalId,
          name: hospitalAdmins.name,
          email: hospitalAdmins.email,
          mobileNumber: hospitalAdmins.mobileNumber,
          role: hospitalAdmins.role,
          isActive: hospitalAdmins.isActive,
          createdAt: hospitalAdmins.createdAt,
          updatedAt: hospitalAdmins.updatedAt,
          hospitalName: hospitals.name,
        })
        .from(hospitalAdmins)
        .leftJoin(hospitals, eq(hospitalAdmins.hospitalId, hospitals.id))
        .where(isNull(hospitalAdmins.deletedAt))
        .orderBy(hospitalAdmins.createdAt);

      return NextResponse.json({
        success: true,
        admins: allAdmins,
        count: allAdmins.length,
      });
    } catch (error) {
      console.error("Error fetching admins:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch admins" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);

// POST create new hospital admin
export const POST = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const body = await request.json();

      // Validation
      if (!body.hospitalId || !body.name || !body.email || !body.password) {
        return NextResponse.json(
          {
            success: false,
            error: "Hospital, name, email, and password are required",
          },
          { status: 400 }
        );
      }

      if (body.password.length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: "Password must be at least 6 characters",
          },
          { status: 400 }
        );
      }

      // Check if email already exists
      const [existingAdmin] = await db
        .select()
        .from(hospitalAdmins)
        .where(eq(hospitalAdmins.email, body.email))
        .limit(1);

      if (existingAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: "An admin with this email already exists",
          },
          { status: 400 }
        );
      }

      // Check if hospital exists and is active
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
          {
            success: false,
            error: "Hospital not found or inactive",
          },
          { status: 404 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);

      // Insert admin
      const [newAdmin] = await db
        .insert(hospitalAdmins)
        .values({
          hospitalId: body.hospitalId,
          name: body.name,
          email: body.email,
          mobileNumber: body.mobileNumber || null,
          password: hashedPassword,
          role: body.role || "admin",
          isActive: true,
        });

      return NextResponse.json({
        success: true,
        message: "Hospital admin created successfully",
        admin: {
          id: newAdmin.insertId,
          hospitalId: body.hospitalId,
          name: body.name,
          email: body.email,
          role: body.role || "admin",
        },
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create admin" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["superadmin"] }
);