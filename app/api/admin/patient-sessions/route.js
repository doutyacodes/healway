// FILE: app/api/admin/patient-sessions/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  patientSessions,
  users,
  rooms,
  hospitalWings,
  nursePatientAssignments,
  nurses,
} from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET all active patient sessions for admin's hospital
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

      // Get all active sessions with patient and room info
      const sessions = await db
        .select({
          sessionId: patientSessions.id,
          userId: users.id,
          patientName: users.name,
          patientMobile: users.mobileNumber,
          patientRole: users.role,
          wingId: hospitalWings.id,
          wingName: hospitalWings.wingName,
          roomId: rooms.id,
          roomNumber: rooms.roomNumber,
          roomType: rooms.roomType,
          admissionType: patientSessions.admissionType,
          startDate: patientSessions.startDate,
          status: patientSessions.status,
        })
        .from(patientSessions)
        .innerJoin(users, eq(patientSessions.userId, users.id))
        .innerJoin(rooms, eq(patientSessions.roomId, rooms.id))
        .innerJoin(hospitalWings, eq(patientSessions.wingId, hospitalWings.id))
        .where(
          and(
            eq(patientSessions.hospitalId, user.hospitalId),
            eq(patientSessions.status, "active")
          )
        )
        .orderBy(patientSessions.startDate);

      // Get assigned nurses for each session
      const sessionsWithNurses = await Promise.all(
        sessions.map(async (session) => {
          const assignedNurses = await db
            .select({
              assignmentId: nursePatientAssignments.id,
              nurseId: nurses.id,
              nurseName: nurses.name,
              nurseEmail: nurses.email,
              nurseMobile: nurses.mobileNumber,
              assignedAt: nursePatientAssignments.assignedAt,
              isActive: nursePatientAssignments.isActive,
            })
            .from(nursePatientAssignments)
            .innerJoin(nurses, eq(nursePatientAssignments.nurseId, nurses.id))
            .where(
              and(
                eq(nursePatientAssignments.sessionId, session.sessionId),
                eq(nursePatientAssignments.isActive, true)
              )
            );

          return {
            ...session,
            assignedNurses,
            nurseCount: assignedNurses.length,
          };
        })
      );

      return NextResponse.json({
        success: true,
        sessions: sessionsWithNurses,
        count: sessionsWithNurses.length,
      });
    } catch (error) {
      console.error("Error fetching patient sessions:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch patient sessions" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);