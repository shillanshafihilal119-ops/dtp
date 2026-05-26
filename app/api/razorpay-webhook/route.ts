import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function markRequestPaidByOrderId(razorpayOrderId: string) {
  const { data: payment, error: paymentFetchError } = await supabase
    .from("payments")
    .select("request_id,amount,payment_type")
    .eq("razorpay_order_id", razorpayOrderId)
    .single();

  if (paymentFetchError || !payment) {
    console.log("Webhook payment record not found:", paymentFetchError);
    return false;
  }

  const { data: request, error: requestFetchError } = await supabase
    .from("paper_requests")
    .select(
      "id,page_count,total_amount,paid_amount,extra_amount_due,payment_status"
    )
    .eq("id", payment.request_id)
    .single();

  if (requestFetchError || !request) {
    console.log("Webhook request not found:", requestFetchError);
    return false;
  }

  const existingPaidAmount = Number(request.paid_amount || 0);
  const paidAmountFromWebhook = Number(payment.amount || 0);

  const newPaidAmount =
    payment.payment_type === "extra"
      ? existingPaidAmount + paidAmountFromWebhook
      : paidAmountFromWebhook;

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
    .eq("id", request.id);

  if (updateError) {
    console.log("Webhook request update error:", updateError);
    return false;
  }

  return true;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event !== "payment.captured") {
      return NextResponse.json({ received: true });
    }

    const paymentEntity = event.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json(
        { error: "Missing Razorpay payment data" },
        { status: 400 }
      );
    }

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        razorpay_payment_id: razorpayPaymentId,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpayOrderId);

    if (paymentUpdateError) {
      console.log("Webhook payment update error:", paymentUpdateError);

      return NextResponse.json(
        { error: "Could not update payment" },
        { status: 500 }
      );
    }

    await markRequestPaidByOrderId(razorpayOrderId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.log("Razorpay webhook error:", error);

    return NextResponse.json(
      { error: "Webhook failed" },
      { status: 500 }
    );
  }
}