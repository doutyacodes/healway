// FILE: app/api/admin/nurses/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nurses, nursingSections } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

// POST create nurse
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
      if (!body.name || !body.sectionId || !body.password) {
        return NextResponse.json(
          { success: false, error: "Name, section, and password are required" },
          { status: 400 }
        );
      }

      if (body.password.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Verify section belongs to hospital
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

      // Check for duplicate email if provided
      if (body.email) {
        const [existingNurse] = await db
          .select()
          .from(nurses)
          .where(
            and(
              eq(nurses.hospitalId, user.hospitalId),
              eq(nurses.email, body.email),
              isNull(nurses.deletedAt)
            )
          )
          .limit(1);

        if (existingNurse) {
          return NextResponse.json(
            { success: false, error: "A nurse with this email already exists" },
            { status: 400 }
          );
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);

      // Create nurse
      const [newNurse] = await db
        .insert(nurses)
        .values({
          hospitalId: user.hospitalId,
          sectionId: body.sectionId,
          name: body.name,
          email: body.email || null,
          mobileNumber: body.mobileNumber || null,
          password: hashedPassword,
          employeeId: body.employeeId || null,
          shiftTiming: body.shiftTiming || null,
          isActive: true,
        });

      return NextResponse.json({
        success: true,
        message: "Nurse created successfully",
        nurse: {
          id: newNurse.insertId,
          name: body.name,
        },
      });
    } catch (error) {
      console.error("Error creating nurse:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create nurse" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);