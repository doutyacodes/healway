// FILE: app/api/admin/hospital/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hospitals } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";

// GET hospital info for logged-in admin
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

      const [hospital] = await db
        .select()
        .from(hospitals)
        .where(
          and(
            eq(hospitals.id, user.hospitalId),
            isNull(hospitals.deletedAt)
          )
        )
        .limit(1);

      if (!hospital) {
        return NextResponse.json(
          { success: false, error: "Hospital not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        hospital,
      });
    } catch (error) {
      console.error("Error fetching hospital:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch hospital" },
        { status: 500 }
      );
    }
  },
  { allowedTypes: ["admin"] }
);