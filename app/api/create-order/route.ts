import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId missing" },
        { status: 400 }
      );
    }

    const { data: request, error } = await supabase
      .from("paper_requests")
      .select("id,total_amount,extra_amount_due,payment_status")
      .eq("id", requestId)
      .single();

    if (error || !request) {
      console.log("Request fetch error:", error);

      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    const amount =
      request.payment_status === "Partially Paid" &&
      Number(request.extra_amount_due) > 0
        ? Number(request.extra_amount_due)
        : Number(request.total_amount);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          error: `Invalid amount. Current amount is ₹${amount}. Upload final PDF again so page count and price are calculated.`,
        },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `vintage_${request.id}_${Date.now()}`,
      notes: {
        requestId: String(request.id),
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.log("Create order error:", error);

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}