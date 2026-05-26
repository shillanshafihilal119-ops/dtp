import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const adminPassword = req.headers.get("x-admin-password");

    if (
      !adminPassword ||
      adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { prices } = await req.json();

    if (!Array.isArray(prices)) {
      return NextResponse.json(
        { error: "Invalid pricing data" },
        { status: 400 }
      );
    }

    for (const item of prices) {
      if (
        !item.medium ||
        typeof item.rate_per_page !== "number" ||
        item.rate_per_page <= 0
      ) {
        return NextResponse.json(
          { error: "Invalid rate value" },
          { status: 400 }
        );
      }

      await supabase
        .from("pricing_settings")
        .upsert(
          {
            medium: item.medium,
            rate_per_page: item.rate_per_page,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "medium",
          }
        );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Failed to update pricing" },
      { status: 500 }
    );
  }
}