// FILE: app/api/admin/patients/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, patientSessions, hospitalWings, rooms } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all patients for admin's hospital
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Fetch all users (patients and bystanders)
      const patientsList = await db
        .select({
          id: users.id,
          name: users.name,
          mobileNumber: users.mobileNumber,
          email: users.email,
          role: users.role,
          otpLoginEnabled: users.otpLoginEnabled,
          isActive: users.isActive,
          createdAt: users.createdAt,
          // Session info
          sessionId: patientSessions.id,
          sessionStartDate: patientSessions.startDate,
          sessionEndDate: patientSessions.endDate,
          sessionStatus: patientSessions.status,
          admissionType: patientSessions.admissionType,
          sessionNotes: patientSessions.notes,
          // Location info
          wingId: patientSessions.wingId,
          wingName: hospitalWings.wingName,
          roomId: patientSessions.roomId,
          roomNumber: rooms.roomNumber,
        })
        .from(users)
        .leftJoin(
          patientSessions,
          and(
            eq(users.id, patientSessions.userId),
            eq(patientSessions.status, "active")
          )
        )
        .leftJoin(hospitalWings, eq(patientSessions.wingId, hospitalWings.id))
        .leftJoin(rooms, eq(patientSessions.roomId, rooms.id))
        .where(
          and(
            eq(users.hospitalId, user.hospitalId),
            isNull(users.deletedAt)
          )
        )
        .orderBy(desc(users.createdAt));

      return NextResponse.json({
        success: true,
        patients: patientsList,
        count: patientsList.length,
      });
    } catch (error) {
      console.error("Error fetching patients:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch patients" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// POST create new patient
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
      if (!body.name || !body.mobileNumber) {
        return NextResponse.json(
          { success: false, error: "Name and mobile number are required" },
          { status: 400 }
        );
      }

      // Validate mobile number format (basic validation)
      const mobileRegex = /^[0-9+\s-()]+$/;
      if (!mobileRegex.test(body.mobileNumber)) {
        return NextResponse.json(
          { success: false, error: "Invalid mobile number format" },
          { status: 400 }
        );
      }

      // Check if mobile number already exists for this hospital
      const [existingUser] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.hospitalId, user.hospitalId),
            eq(users.mobileNumber, body.mobileNumber),
            isNull(users.deletedAt)
          )
        )
        .limit(1);

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: "A user with this mobile number already exists",
          },
          { status: 400 }
        );
      }

      // Insert patient
      const [newPatient] = await db
        .insert(users)
        .values({
          hospitalId: user.hospitalId,
          name: body.name,
          mobileNumber: body.mobileNumber,
          email: body.email || null,
          role: body.role || "patient",
          otpLoginEnabled: true,
          createdByAdminId: user.id,
          isActive: true,
        });

      return NextResponse.json({
        success: true,
        message: "Patient created successfully",
        patient: {
          id: newPatient.insertId,
          ...body,
        },
      });
    } catch (error) {
      console.error("Error creating patient:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create patient" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);