// FILE: app/api/admin/wings/[id]/visiting-hours/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitalWings, visitingHours } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

export const POST = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();

      // ✅ FIX: unwrap params properly
      const { id } = await context.params;
      const wingId = parseInt(id);

      const body = await request.json();

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      // ✅ Validate wing exists
      const [wing] = await db
        .select()
        .from(hospitalWings)
        .where(
          and(
            eq(hospitalWings.id, wingId),
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

      // Delete old visiting hours
      await db
        .delete(visitingHours)
        .where(
          and(
            eq(visitingHours.hospitalId, user.hospitalId),
            eq(visitingHours.wingId, wingId)
          )
        );

      // Build new visiting hours
      const newVisitingHours = [];

      if (body.applyToAllDays) {
        for (const slot of body.timeSlots) {
          if (!slot.startTime || !slot.endTime) continue;
          newVisitingHours.push({
            hospitalId: user.hospitalId,
            wingId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            dayOfWeek: null,
            isActive: true,
          });
        }
      } else {
        const days = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ];

        for (const day of days) {
          const config = body.specificDays?.[day];
          if (config?.enabled && config.slots) {
            for (const slot of config.slots) {
              if (!slot.startTime || !slot.endTime) continue;
              newVisitingHours.push({
                hospitalId: user.hospitalId,
                wingId,
                startTime: slot.startTime,
                endTime: slot.endTime,
                dayOfWeek: day,
                isActive: true,
              });
            }
          }
        }
      }

      if (newVisitingHours.length > 0) {
        await db.insert(visitingHours).values(newVisitingHours);
      }

      return NextResponse.json({
        success: true,
        message: "Visiting hours updated successfully",
        count: newVisitingHours.length,
      });
    } catch (error) {
      console.error("Error updating visiting hours:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update visiting hours" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);

export const GET = withAuth(
  async (request, context, user) => {
    try {
      const db = await getDb();

      // ✅ FIX: unwrap params
      const { id } = await context.params;
      const wingId = parseInt(id);

      if (!user.hospitalId) {
        return NextResponse.json(
          { success: false, error: "No hospital associated with this admin" },
          { status: 404 }
        );
      }

      const [wing] = await db
        .select()
        .from(hospitalWings)
        .where(
          and(
            eq(hospitalWings.id, wingId),
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

      const hours = await db
        .select()
        .from(visitingHours)
        .where(
          and(
            eq(visitingHours.hospitalId, user.hospitalId),
            eq(visitingHours.wingId, wingId)
          )
        )
        .orderBy(visitingHours.dayOfWeek, visitingHours.startTime);

      return NextResponse.json({
        success: true,
        visitingHours: hours,
        count: hours.length,
      });
    } catch (error) {
      console.error("Error fetching visiting hours:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch visiting hours" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);
