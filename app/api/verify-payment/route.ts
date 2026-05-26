import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      requestId,
    } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const { data: request, error } = await supabase
      .from("paper_requests")
      .select(
        "id,page_count,total_amount,paid_amount,extra_amount_due,payment_status"
      )
      .eq("id", requestId)
      .single();

    if (error || !request) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const payableAmount =
      request.payment_status === "Partially Paid" &&
      Number(request.extra_amount_due) > 0
        ? Number(request.extra_amount_due)
        : Number(request.total_amount);

    const existingPaidAmount = Number(request.paid_amount || 0);

    const newPaidAmount =
      request.payment_status === "Partially Paid"
        ? existingPaidAmount + payableAmount
        : Number(request.total_amount || payableAmount);

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        razorpay_payment_id,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id);

    if (paymentUpdateError) {
      console.log("Payment record update error:", paymentUpdateError);
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("paper_requests")
      .update({
        payment_status: "Paid",
        paid_page_count: request.page_count || 0,
        paid_amount: newPaidAmount,
        extra_pages: 0,
        extra_amount_due: 0,
        payment_note: null,
      })
      .eq("id", requestId);

    if (updateError) {
      console.log(updateError);
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paidAmount: newPaidAmount,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}