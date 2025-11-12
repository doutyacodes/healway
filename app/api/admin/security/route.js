// FILE: app/api/admin/security/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { securities, hospitalWings } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

// POST create security personnel
export const POST = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const body = await request.json();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Validation
      if (!body.name || !body.assignedWingId || !body.password) {
        return NextResponse.json(
          { success: false, error: "Name, assigned wing, and password are required" },
          { status: 400 }
        );
      }

      if (body.password.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Verify wing belongs to hospital
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

      // Check for duplicate username if provided
      if (body.username) {
        const [existing] = await db
          .select()
          .from(securities)
          .where(
            and(
              eq(securities.hospitalId, user.hospitalId),
              eq(securities.username, body.username),
              isNull(securities.deletedAt)
            )
          )
          .limit(1);

        if (existing) {
          return NextResponse.json(
            { success: false, error: "A security person with this username already exists" },
            { status: 400 }
          );
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);

      // Create security personnel
      const [newSecurity] = await db
        .insert(securities)
        .values({
          hospitalId: user.hospitalId,
          assignedWingId: body.assignedWingId,
          name: body.name,
          username: body.username || null,
          mobileNumber: body.mobileNumber || null,
          password: hashedPassword,
          employeeId: body.employeeId || null,
          shiftTiming: body.shiftTiming || null,
          photoUrl: body.photoUrl || null,
          isActive: true,
        });

      return NextResponse.json({
        success: true,
        message: "Security personnel created successfully",
        security: {
          id: newSecurity.insertId,
          name: body.name,
        },
      });
    } catch (error) {
      console.error("Error creating security personnel:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create security personnel" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);