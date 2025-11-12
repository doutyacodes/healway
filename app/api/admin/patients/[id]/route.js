// FILE: app/api/admin/patients/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, patientSessions } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET single patient
export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const patientId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      const [patient] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, patientId),
            eq(users.hospitalId, user.hospitalId),
            isNull(users.deletedAt)
          )
        )
        .limit(1);

      if (!patient) {
        return NextResponse.json(
          { success: false, error: "Patient not found" },
          { status: 404 }
        );
      }

      // Get active session if any
      const [activeSession] = await db
        .select()
        .from(patientSessions)
        .where(
          and(
            eq(patientSessions.userId, patientId),
            eq(patientSessions.status, "active")
          )
        )
        .limit(1);

      return NextResponse.json({
        success: true,
        patient: {
          ...patient,
          activeSession,
        },
      });
    } catch (error) {
      console.error("Error fetching patient:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch patient" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// PUT update patient
export const PUT = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const patientId = parseInt(id);
      const body = await request.json();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if patient exists
      const [existingPatient] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, patientId),
            eq(users.hospitalId, user.hospitalId),
            isNull(users.deletedAt)
          )
        )
        .limit(1);

      if (!existingPatient) {
        return NextResponse.json(
          { success: false, error: "Patient not found" },
          { status: 404 }
        );
      }

      // If mobile number is being changed, check for duplicates
      if (
        body.mobileNumber &&
        body.mobileNumber !== existingPatient.mobileNumber
      ) {
        const [duplicate] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.hospitalId, user.hospitalId),
              eq(users.mobileNumber, body.mobileNumber),
              ne(users.id, patientId),
              isNull(users.deletedAt)
            )
          )
          .limit(1);

        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              error: "A user with this mobile number already exists",
            },
            { status: 400 }
          );
        }
      }

      // Update patient
      await db
        .update(users)
        .set({
          name: body.name || existingPatient.name,
          mobileNumber: body.mobileNumber || existingPatient.mobileNumber,
          email: body.email !== undefined ? body.email : existingPatient.email,
          role: body.role || existingPatient.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, patientId));

      // Fetch updated patient
      const [updatedPatient] = await db
        .select()
        .from(users)
        .where(eq(users.id, patientId))
        .limit(1);

      return NextResponse.json({
        success: true,
        message: "Patient updated successfully",
        patient: updatedPatient,
      });
    } catch (error) {
      console.error("Error updating patient:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update patient" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

// DELETE patient (soft delete)
export const DELETE = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();
      const { id } = await context.params;

      const patientId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // Check if patient exists
      const [existingPatient] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, patientId),
            eq(users.hospitalId, user.hospitalId),
            isNull(users.deletedAt)
          )
        )
        .limit(1);

      if (!existingPatient) {
        return NextResponse.json(
          { success: false, error: "Patient not found" },
          { status: 404 }
        );
      }

      // Check if patient has active session
      const [activeSession] = await db
        .select()
        .from(patientSessions)
        .where(
          and(
            eq(patientSessions.userId, patientId),
            eq(patientSessions.status, "active")
          )
        )
        .limit(1);

      if (activeSession) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot delete patient with active session. Please discharge the patient first.",
          },
          { status: 400 }
        );
      }

      // Soft delete
      await db
        .update(users)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, patientId));

      return NextResponse.json({
        success: true,
        message: "Patient deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting patient:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete patient" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);
