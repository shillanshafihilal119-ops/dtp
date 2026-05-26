"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function TrackPage() {
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState("");
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  function getPayableAmount(request: any) {
    if (
      request.payment_status === "Partially Paid" &&
      Number(request.extra_amount_due) > 0
    ) {
      return Number(request.extra_amount_due);
    }

    return Number(request.total_amount || 0);
  }

  async function searchRequests(e: React.FormEvent) {
    e.preventDefault();

    const cleanPhone = phone.trim();
    const cleanRequestId = requestId.trim();

    if (!cleanPhone && !cleanRequestId) {
      alert("Please enter Request ID or phone number.");
      return;
    }

    setSearched(false);
    setLoading(true);

    let query = supabase
      .from("paper_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (cleanRequestId && cleanPhone) {
      query = query.or(`request_id.eq.${cleanRequestId},phone.eq.${cleanPhone}`);
    } else if (cleanRequestId) {
      query = query.eq("request_id", cleanRequestId);
    } else {
      query = query.eq("phone", cleanPhone);
    }

    const { data, error } = await query;

    setLoading(false);
    setSearched(true);

    if (error) {
      alert("Could not find requests");
      console.log(error);
    } else {
      setRequests(data || []);
    }
  }

  async function payNow(request: any) {
    try {
      setPaymentLoading(true);

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: request.id,
        }),
      });

      const order = await orderRes.json();

      if (!order.id) {
        alert(order.error || "Could not create payment order");
        return;
      }

      const amountToPay = getPayableAmount(request);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Vintage DTP",
        description:
          request.payment_status === "Partially Paid"
            ? "Additional pages payment"
            : "Question Paper Formatting",
        order_id: order.id,

        handler: async function (response: any) {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...response,
              requestId: request.id,
            }),
          });

          const verify = await verifyRes.json();

          if (verify.success) {
            showToast("Payment successful. Final PDF unlocked.");

            setRequests((prev) =>
              prev.map((item) =>
                item.id === request.id
                  ? {
                      ...item,
                      payment_status: "Paid",
                      paid_page_count: item.page_count || 0,
                      paid_amount: Number(item.paid_amount || 0) + amountToPay,
                      extra_pages: 0,
                      extra_amount_due: 0,
                      payment_note: null,
                    }
                  : item
              )
            );
          } else {
            alert("Payment verification failed");
          }
        },

        theme: {
          color: "#eab308",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.log(error);
      alert("Payment failed");
    } finally {
      setPaymentLoading(false);
    }
  }

  async function downloadFinalPdf(request: any) {
    try {
      setDownloadingId(request.id);

      const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/final-papers/${request.final_pdf_url}`;

      const response = await fetch(fileUrl, {
        cache: "no-store",
      });

      if (!response.ok) {
        alert("Download failed");
        return;
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Vintage-DTP-${request.request_id}.pdf`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      if (request.status !== "Delivered") {
        await supabase
          .from("paper_requests")
          .update({
            status: "Delivered",
          })
          .eq("id", request.id);

        setRequests((prev) =>
          prev.map((item) =>
            item.id === request.id
              ? {
                  ...item,
                  status: "Delivered",
                }
              : item
          )
        );
      }

      showToast("Download started.");
    } catch (error) {
      console.log(error);
      alert("Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10 animate-fade-in">
      {toast && (
        <div className="fixed right-6 top-6 z-[9999] rounded-2xl border border-green-500/20 bg-zinc-950 p-5 shadow-xl">
          <p className="font-bold text-green-400">✓ Success</p>
          <p className="mt-1 text-sm text-gray-300">{toast}</p>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-lg border border-yellow-500 bg-black p-6">
            <p className="text-lg text-yellow-400">Searching Request...</p>
          </div>
        </div>
      )}

      <section className="mx-auto mb-10 max-w-6xl">
        <p className="mb-4 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400">
          Track Request
        </p>

        <h1 className="text-4xl font-bold text-yellow-500 sm:text-5xl">
          Track Your Paper
        </h1>

        <p className="mt-4 max-w-2xl text-gray-400">
          Enter your Request ID for the exact paper. If you do not have it, you
          can search by phone number and select the correct request.
        </p>
      </section>

      <form
        onSubmit={searchRequests}
        className="mx-auto mb-6 flex max-w-6xl flex-col gap-3 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 sm:flex-row"
      >
        <input
          type="text"
          placeholder="Enter Request ID"
          value={requestId}
          onChange={(e) =>
            setRequestId(
              e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")
            )
          }
          maxLength={20}
          className="w-full rounded border border-yellow-500/20 bg-black/60 p-3 text-white placeholder:text-gray-500 outline-none focus:border-yellow-500"
        />

        <div className="flex items-center justify-center px-2">
          <p className="whitespace-nowrap text-sm font-semibold text-yellow-400">
            OR
          </p>
        </div>

        <input
          type="text"
          placeholder="Enter Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          maxLength={12}
          className="w-full rounded border border-yellow-500/20 bg-black/60 p-3 text-white placeholder:text-gray-500 outline-none focus:border-yellow-500"
        />

        <button
          disabled={loading || (!phone.trim() && !requestId.trim())}
          className="rounded bg-yellow-500 px-5 py-3 font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="mx-auto mb-8 max-w-6xl rounded-xl border border-yellow-500/10 bg-black/40 p-4">
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-yellow-400">Recommended:</span>{" "}
          Search using your Request ID for the exact paper. Use phone number
          only if you do not have the Request ID. One phone number may have
          multiple paper requests.
        </p>
      </div>

      {searched && requests.length > 1 && (
        <div className="mx-auto mb-5 max-w-6xl rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
          <p className="font-bold text-yellow-500">Multiple Requests Found</p>

          <p className="mt-2 text-sm text-gray-400">
            We found {requests.length} requests linked to this phone number.
            Match your paper using the Request ID, subject, class, and details
            shown below.
          </p>
        </div>
      )}

      <div className="grid gap-5">
        {requests.map((request) => {
          const delivered =
            request.status === "Delivered" &&
            request.payment_status === "Paid";

          const payableAmount = getPayableAmount(request);

          return (
            <div
              key={request.id}
              className="mx-auto w-full max-w-6xl rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 shadow-lg"
            >
              <div className="mb-6 rounded-xl border border-yellow-500/10 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Request ID
                </p>

                <p className="mt-1 break-all text-xl font-bold text-yellow-500">
                  {request.request_id}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["School", request.school],
                  ["Class", request.class],
                  ["Subject", request.subject],
                  ["Session", request.session],
                  ["Examination", request.examination],
                  ["Marks", request.marks],
                  ["Duration", request.duration],
                  ["Medium", request.medium],
                  ["Final Pages", request.page_count || 0],
                  ["Total Amount", `₹${request.total_amount || 0}`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-yellow-500/10 bg-black/40 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {label}
                    </p>

                    <p className="mt-1 font-semibold text-white">{value}</p>
                  </div>
                ))}

                <p>
                  <b>Status:</b>{" "}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      request.status === "Submitted"
                        ? "bg-blue-500 text-white"
                        : request.status === "In Progress"
                        ? "bg-yellow-500 text-black"
                        : request.status === "Ready"
                        ? "bg-orange-500 text-black"
                        : "bg-green-500 text-black"
                    }`}
                  >
                    {request.status}
                  </span>
                </p>

                <p>
                  <b>Payment:</b>{" "}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      request.payment_status === "Paid"
                        ? "bg-green-500 text-black"
                        : request.payment_status === "Partially Paid"
                        ? "bg-orange-500 text-black"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {request.payment_status || "Unpaid"}
                  </span>
                </p>
              </div>

              <div className="mt-8">
                <h3 className="mb-8 text-xl font-bold text-white">
                  Delivery Progress
                </h3>

                <div className="relative flex items-center justify-between">
                  <div className="absolute left-0 top-5 h-1 w-full rounded-full bg-zinc-800" />

                  <div
                    className={`absolute left-0 top-5 h-1 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-[1800ms] ease-out ${
                      request.status === "Submitted"
                        ? "w-[0%]"
                        : request.status === "In Progress"
                        ? "w-[33%]"
                        : request.status === "Ready"
                        ? "w-[66%]"
                        : "w-full"
                    }`}
                  />

                  {["Submitted", "In Progress", "Ready", "Delivered"].map(
                    (step) => {
                      const active =
                        step === request.status ||
                        request.status === "Delivered" ||
                        (request.status === "Ready" && step !== "Delivered") ||
                        (request.status === "In Progress" &&
                          (step === "Submitted" || step === "In Progress"));

                      return (
                        <div
                          key={step}
                          className="relative z-10 flex flex-col items-center"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-4 font-bold transition-all duration-700 ${
                              active
                                ? "border-yellow-500 bg-yellow-500 text-black"
                                : "border-zinc-700 bg-black text-gray-500"
                            }`}
                          >
                            {active ? "✓" : "•"}
                          </div>

                          <p className="mt-3 text-center text-xs">{step}</p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {request.preview_url && request.status !== "In Progress" && (
                <div className="mt-8 flex flex-col items-center">
                  <p className="mb-4 text-lg font-bold text-yellow-500">
                    Final Paper Preview
                  </p>

                  <div className="group relative w-full max-w-md overflow-hidden rounded-2xl border border-yellow-500/20 bg-black p-2">
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/paper-previews/${request.preview_url}`}
                      alt="Final Paper Preview"
                      className="w-full rounded-xl transition-all duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>
              )}

              {request.payment_status === "Partially Paid" &&
                request.final_pdf_url && (
                  <div className="mt-6 rounded-2xl border border-orange-500/30 bg-zinc-950 p-6">
                    <p className="text-xl font-bold text-orange-400">
                      Additional Pages Added After Correction
                    </p>

                    <p className="mt-3 text-gray-300">
                      Your corrected question paper now contains more pages than
                      the previously paid final PDF. Your previous payment is
                      still valid. Only the extra pages are charged.
                    </p>

                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <p>
                        <b>Previously Paid Pages:</b>{" "}
                        {request.paid_page_count || 0}
                      </p>

                      <p>
                        <b>Updated Final Pages:</b> {request.page_count || 0}
                      </p>

                      <p>
                        <b>Additional Pages:</b> {request.extra_pages || 0}
                      </p>

                      <p>
                        <b>Extra Amount:</b> ₹
                        {request.extra_amount_due || 0}
                      </p>
                    </div>

                    {request.payment_note && (
                      <p className="mt-4 rounded-xl border border-yellow-500/10 bg-black/40 p-4 text-sm text-gray-300">
                        {request.payment_note}
                      </p>
                    )}

                    <button
                      onClick={() => payNow(request)}
                      disabled={paymentLoading}
                      className="mt-5 rounded bg-yellow-500 px-5 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
                    >
                      {paymentLoading
                        ? "Opening Payment..."
                        : `Pay Extra ₹${request.extra_amount_due || 0}`}
                    </button>
                  </div>
                )}

              {request.final_pdf_url &&
                request.payment_status !== "Paid" &&
                request.payment_status !== "Partially Paid" && (
                  <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-zinc-950 p-6">
                    <p className="text-xl font-bold text-yellow-500">
                      Your paper is ready
                    </p>

                    <p className="mt-2 text-gray-400">
                      Preview is available above. Complete payment to unlock the
                      final PDF.
                    </p>

                    <div className="mt-4 space-y-1 text-sm">
                      <p>Final Pages: {request.page_count || 0}</p>
                      <p>Amount: ₹{payableAmount}</p>
                      <p>Request ID: {request.request_id}</p>

                      <button
                        onClick={() => payNow(request)}
                        disabled={paymentLoading || payableAmount <= 0}
                        className="mt-4 rounded bg-yellow-500 px-5 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
                      >
                        {paymentLoading
                          ? "Opening Payment..."
                          : `Pay ₹${payableAmount} Now`}
                      </button>
                    </div>
                  </div>
                )}

              {request.payment_status === "Paid" && request.final_pdf_url && (
                <div className="mt-6 rounded-2xl border border-green-500/30 bg-zinc-950 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xl font-bold text-green-400">
                        ✓ Final Paper Ready
                      </p>

                      <p className="mt-2 text-gray-400">
                        Payment verified. Download your final formatted PDF
                        below.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => downloadFinalPdf(request)}
                      disabled={downloadingId === request.id}
                      className="rounded-xl bg-green-500 px-5 py-3 text-center font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingId === request.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                          Downloading...
                        </span>
                      ) : (
                        "Download Final PDF"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {delivered && !request.correction_notes && (
                <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6">
                  <p className="text-xl font-bold text-yellow-500">
                    Need Correction?
                  </p>

                  <textarea
                    placeholder="Need corrections? Write here..."
                    value={correctionNotes}
                    onChange={(e) => setCorrectionNotes(e.target.value)}
                    className="mt-4 w-full rounded border border-yellow-500/20 bg-black p-3 text-white placeholder:text-gray-500 outline-none focus:border-yellow-500"
                  />

                  <button
                    onClick={async () => {
                      if (!correctionNotes.trim()) {
                        alert("Please write correction details first.");
                        return;
                      }

                      setCorrectionLoading(true);

                      await supabase
                        .from("paper_requests")
                        .update({
                          status: "Submitted",
                          final_pdf_url: null,
                          preview_url: null,
                          correction_notes: correctionNotes,
                        })
                        .eq("request_id", request.request_id);

                      setCorrectionLoading(false);

                      setRequests((prev) =>
                        prev.map((item) =>
                          item.request_id === request.request_id
                            ? {
                                ...item,
                                status: "Submitted",
                                final_pdf_url: null,
                                preview_url: null,
                                correction_notes: correctionNotes,
                              }
                            : item
                        )
                      );

                      setCorrectionNotes("");

                      showToast("Correction request submitted successfully.");
                    }}
                    disabled={correctionLoading}
                    className="mt-3 rounded bg-yellow-500 px-4 py-2 text-black disabled:opacity-50"
                  >
                    {correctionLoading
                      ? "Submitting..."
                      : "Request Correction"}
                  </button>
                </div>
              )}

              {request.correction_notes && (
                <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6">
                  <p className="font-bold text-yellow-500">
                    Correction Submitted
                  </p>

                  <p className="mt-2 text-gray-400">
                    Your correction request has been received. It is now marked
                    as Submitted and will be reviewed before work starts.
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {searched && requests.length === 0 && (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="text-xl font-bold text-red-400">
              ⚠ Request Not Found
            </p>

            <p className="mt-3 text-gray-400">
              We could not find any request matching the Request ID or phone
              number entered.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Please check your Request ID first. If unavailable, try the phone
              number used during submission.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}