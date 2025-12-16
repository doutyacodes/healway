// FILE: app/api/mobile-api/security/verify-qr/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  guests,
  patientSessions,
  users,
  hospitalWings,
  rooms,
  visitingHours,
  guestLogs,
} from "@/lib/db/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// POST verify QR code
export const POST = withAuth(
  async (request, context, security) => {
    try {
      const body = await request.json();
      console.log("Received QR verification request:", body);
      const { qrCode, qrData } = body;

      // ---- NORMALIZE QR CODE (frontend-agnostic) ----
      let qrCodeToVerify = null;

      // Case 1: qrData exists
      if (qrData) {
        try {
          const parsed =
            typeof qrData === "string" ? JSON.parse(qrData) : qrData;
          qrCodeToVerify = parsed?.qrCode ?? null;
        } catch {
          return NextResponse.json(
            { success: false, error: "Invalid QR data format" },
            { status: 400 }
          );
        }
      }

      // Case 2: qrCode exists
      if (!qrCodeToVerify && qrCode) {
        // If qrCode is already a string QR
        if (typeof qrCode === "string") {
          // If it's JSON string, parse it
          if (qrCode.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(qrCode);
              qrCodeToVerify = parsed?.qrCode ?? null;
            } catch {
              return NextResponse.json(
                { success: false, error: "Invalid QR code format" },
                { status: 400 }
              );
            }
          } else {
            qrCodeToVerify = qrCode;
          }
        }

        // If qrCode is an object
        if (typeof qrCode === "object") {
          qrCodeToVerify = qrCode.qrCode ?? null;
        }
      }

      if (!qrCodeToVerify) {
        return NextResponse.json(
          { success: false, error: "QR code not found in request" },
          { status: 400 }
        );
      }

      if (!qrCode && !qrData) {
        return NextResponse.json(
          { success: false, error: "QR code or data is required" },
          { status: 400 }
        );
      }

      const db = await getDb();
// Add this at the beginning of your API route handler
const currentTime = new Date(
  new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
);

console.log("Vercel Server Time:", {
  iso: currentTime.toISOString(),
  local: currentTime.toLocaleString(),
  utc: currentTime.toUTCString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  timestamp: currentTime.getTime(),
  date: currentTime.toLocaleDateString(),
  time: currentTime.toLocaleTimeString(),
  hours: currentTime.getHours(),
  minutes: currentTime.getMinutes(),
  seconds: currentTime.getSeconds()
});
      // Parse QR data if provided as JSON string
      let parsedQrData;
      if (qrData) {
        try {
          parsedQrData =
            typeof qrData === "string" ? JSON.parse(qrData) : qrData;
        } catch (error) {
          return NextResponse.json(
            { success: false, error: "Invalid QR data format" },
            { status: 400 }
          );
        }
      }


      if (!qrCodeToVerify) {
        return NextResponse.json(
          { success: false, error: "QR code not found in data" },
          { status: 400 }
        );
      }

      // Fetch guest details with all related information
      const [guestDetails] = await db
        .select({
          // Guest info
          guestId: guests.id,
          guestName: guests.guestName,
          guestPhone: guests.guestPhone,
          relationshipToPatient: guests.relationshipToPatient,
          guestType: guests.guestType,
          guestIdProof: guests.guestIdProof,
          qrCode: guests.qrCode,
          validFrom: guests.validFrom,
          validUntil: guests.validUntil,
          status: guests.status,
          purpose: guests.purpose,
          qrScanLimit: guests.qrScanLimit,
          qrScansUsed: guests.qrScansUsed,
          qrExpiresAt: guests.qrExpiresAt,

          // Session info
          sessionId: patientSessions.id,
          sessionStatus: patientSessions.status,
          sessionStartDate: patientSessions.startDate,
          sessionEndDate: patientSessions.endDate,
          wingId: patientSessions.wingId,
          roomId: patientSessions.roomId,

          // Patient info
          patientUserId: users.id,
          patientName: users.name,
          patientMobile: users.mobileNumber,

          // Location info
          wingName: hospitalWings.wingName,
          wingCode: hospitalWings.wingCode,
          roomNumber: rooms.roomNumber,
          roomType: rooms.roomType,
        })
        .from(guests)
        .leftJoin(patientSessions, eq(guests.sessionId, patientSessions.id))
        .leftJoin(users, eq(patientSessions.userId, users.id))
        .leftJoin(hospitalWings, eq(patientSessions.wingId, hospitalWings.id))
        .leftJoin(rooms, eq(patientSessions.roomId, rooms.id))
        .where(
          and(
            eq(guests.qrCode, qrCodeToVerify),
            eq(guests.hospitalId, security.hospitalId)
          )
        )
        .limit(1);

      if (!guestDetails) {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            error: "Guest pass not found",
            reason: "INVALID_QR",
          },
          { status: 404 }
        );
      }

      // Validation checks
      const validations = {
        isApproved: guestDetails.status === "approved",
        isActive:
          guestDetails.status !== "revoked" && guestDetails.status !== "denied",
        isSessionActive: guestDetails.sessionStatus === "active",
        isWithinValidPeriod:
          new Date(guestDetails.validFrom) <= currentTime &&
          new Date(guestDetails.validUntil) >= currentTime,
        isQrNotExpired:
          !guestDetails.qrExpiresAt ||
          new Date(guestDetails.qrExpiresAt) >= currentTime,
        hasScansRemaining:
          guestDetails.qrScanLimit === null ||
          guestDetails.qrScansUsed < guestDetails.qrScanLimit,
      };

      // Check if guest is currently inside
      const [currentLog] = await db
        .select()
        .from(guestLogs)
        .where(
          and(
            eq(guestLogs.guestId, guestDetails.guestId),
            eq(guestLogs.currentlyInside, true)
          )
        )
        .limit(1);

      const isCurrentlyInside = !!currentLog;

      // Get visiting hours for validation
      const currentDay = currentTime
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const visitingHoursList = await db
        .select()
        .from(visitingHours)
        .where(
          and(
            eq(visitingHours.hospitalId, security.hospitalId),
            or(
              eq(visitingHours.wingId, guestDetails.wingId),
              isNull(visitingHours.wingId)
            ),
            or(
              eq(visitingHours.dayOfWeek, currentDay),
              isNull(visitingHours.dayOfWeek)
            ),
            eq(visitingHours.isActive, true)
          )
        );

      const isWithinVisitingHours = visitingHoursList.some((hours) => {
        const [startHour, startMin] = hours.startTime.split(":").map(Number);
        const [endHour, endMin] = hours.endTime.split(":").map(Number);

        const startTimeInMinutes = startHour * 60 + startMin;
        const endTimeInMinutes = endHour * 60 + endMin;

        return (
          currentTimeInMinutes >= startTimeInMinutes &&
          currentTimeInMinutes <= endTimeInMinutes
        );
      });

      // Determine access decision
      let accessGranted = false;
      let accessReason = "";
      let denialReason = "";

      if (!validations.isApproved) {
        denialReason = "Guest pass is not approved";
      } else if (!validations.isActive) {
        denialReason = "Guest pass has been revoked or denied";
      } else if (!validations.isSessionActive) {
        denialReason = "Patient session has ended or is not active";
      } else if (!validations.isWithinValidPeriod) {
        if (new Date(guestDetails.validFrom) > currentTime) {
          denialReason = "Guest pass is not yet valid";
        } else {
          denialReason = "Guest pass has expired";
        }
      } else if (!validations.isQrNotExpired) {
        denialReason = "QR code has expired";
      } else if (!validations.hasScansRemaining) {
        denialReason = "QR code scan limit exceeded";
      } else if (!isWithinVisitingHours && !isCurrentlyInside) {
        denialReason = "Outside visiting hours";
      } else {
        accessGranted = true;
        accessReason = isCurrentlyInside
          ? "Guest checkout - was inside"
          : "Access granted - within visiting hours";
      }

      // Prepare response
      const response = {
        success: true,
        verified: accessGranted,
        accessGranted,
        accessReason,
        denialReason,
        isCurrentlyInside,
        guest: {
          id: guestDetails.guestId,
          name: guestDetails.guestName,
          phone: guestDetails.guestPhone,
          relationship: guestDetails.relationshipToPatient,
          type: guestDetails.guestType,
          idProof: guestDetails.guestIdProof,
          purpose: guestDetails.purpose,
          qrCode: guestDetails.qrCode,
          validFrom: guestDetails.validFrom,
          validUntil: guestDetails.validUntil,
          status: guestDetails.status,
          scansUsed: guestDetails.qrScansUsed,
          scanLimit: guestDetails.qrScanLimit,
        },
        patient: {
          id: guestDetails.patientUserId,
          name: guestDetails.patientName,
          mobile: guestDetails.patientMobile,
        },
        session: {
          id: guestDetails.sessionId,
          status: guestDetails.sessionStatus,
          startDate: guestDetails.sessionStartDate,
          endDate: guestDetails.sessionEndDate,
        },
        location: {
          wingId: guestDetails.wingId,
          wingName: guestDetails.wingName,
          wingCode: guestDetails.wingCode,
          roomId: guestDetails.roomId,
          roomNumber: guestDetails.roomNumber,
          roomType: guestDetails.roomType,
        },
        visitingHours: visitingHoursList.map((vh) => ({
          startTime: vh.startTime,
          endTime: vh.endTime,
          dayOfWeek: vh.dayOfWeek,
        })),
        validations,
        isWithinVisitingHours,
        currentTime: currentTime.toISOString(),
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error("Error verifying QR code:", error);
      return NextResponse.json(
        { success: false, error: "QR verification failed" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["security"] }
);
