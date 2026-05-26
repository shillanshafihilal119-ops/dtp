import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const adminPassword = req.headers.get("x-admin-password");

  if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      *,
      paper_requests (
        request_id,
        teacher_name,
        phone,
        subject,
        class,
        payment_status
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Admin payments fetch error:", error);

    return NextResponse.json(
      { error: "Failed to load payments" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    payments: data || [],
  });
}