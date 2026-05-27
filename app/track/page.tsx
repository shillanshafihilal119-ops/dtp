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

  function formatStepTime(value: string | null | undefined) {
    if (!value) return "Pending";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        const deliveredAt = new Date().toISOString();

        await supabase
          .from("paper_requests")
          .update({
            status: "Delivered",
            delivered_at: deliveredAt,
            correction_notes: null,
          })
          .eq("id", request.id);

        setRequests((prev) =>
          prev.map((item) =>
            item.id === request.id
              ? {
                  ...item,
                  status: "Delivered",
                  delivered_at: deliveredAt,
                  correction_notes: null,
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
    <main className="min-h-screen px-4 py-7 sm:px-10 sm:py-12">
      {toast && (
        <div className="fixed right-4 top-4 z-9999 rounded-2xl border border-green-500/20 bg-zinc-950 p-4 shadow-xl sm:right-6 sm:top-6 sm:p-5">
          <p className="font-bold text-green-400">✓ Success</p>
          <p className="mt-1 text-sm text-gray-300">{toast}</p>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="rounded-lg border border-yellow-500 bg-black p-6">
            <p className="text-lg text-yellow-400">Searching Request...</p>
          </div>
        </div>
      )}

      <section className="mx-auto mb-7 max-w-6xl sm:mb-10">
        <p className="mb-4 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400">
          Track Request
        </p>

        <h1 className="text-3xl font-bold text-yellow-500 sm:text-5xl">
          Track Your Paper
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:mt-4 sm:text-base sm:leading-7">
          Enter your Request ID for the exact paper. If you do not have it, you
          can search by phone number and select the correct request.
        </p>
      </section>

      <form
        onSubmit={searchRequests}
        className="mx-auto mb-5 flex max-w-6xl flex-col gap-3 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:mb-6 sm:flex-row sm:p-6"
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

      <div className="mx-auto mb-7 max-w-6xl rounded-xl border border-yellow-500/10 bg-black/40 p-3 sm:mb-8 sm:p-4">
        <p className="text-sm leading-6 text-gray-300">
          <span className="font-semibold text-yellow-400">Recommended:</span>{" "}
          Search using your Request ID for the exact paper. Use phone number
          only if you do not have the Request ID.
        </p>
      </div>

      {searched && requests.length > 1 && (
        <div className="mx-auto mb-5 max-w-6xl rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-5">
          <p className="font-bold text-yellow-500">Multiple Requests Found</p>

          <p className="mt-2 text-sm leading-6 text-gray-400">
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
              className="mx-auto w-full max-w-6xl rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 shadow-lg sm:p-6"
            >
              <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6">
                <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Request ID
                  </p>

                  <p className="mt-1 break-all text-sm font-bold text-yellow-500 sm:text-xl">
                    {request.request_id}
                  </p>
                </div>

                <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Submitted On
                  </p>

                  <p className="mt-1 text-sm font-semibold leading-5 text-white sm:text-base">
                    {new Date(request.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {[
                  ["Teacher", request.teacher_name],
                  ["School", request.school],
                  ["Class", request.class],
                  ["Subject", request.subject],
                  ["Session", request.session],
                  ["Examination", request.examination],
                  ["Marks", request.marks],
                  ["Duration", request.duration],
                  ["Medium", request.medium],
                  ["Final Pages", request.page_count || 0],
                  [
                    "Rate / Page",
                    `₹${
                      request.page_count
                        ? Math.round(
                            Number(request.total_amount || 0) /
                              Number(request.page_count)
                          )
                        : 0
                    }`,
                  ],
                  ["Total Amount", `₹${request.total_amount || 0}`],
                  ["Paid Amount", `₹${request.paid_amount || 0}`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-yellow-500/10 bg-black/40 p-3 sm:p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {label}
                    </p>

                    <p className="mt-1 wrap-break-word text-sm font-semibold text-white sm:text-base">
                      {value}
                    </p>
                  </div>
                ))}

                <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Status
                  </p>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
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
                </div>

                <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Payment
                  </p>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      request.payment_status === "Paid"
                        ? "bg-green-500 text-black"
                        : request.payment_status === "Partially Paid"
                        ? "bg-orange-500 text-black"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {request.payment_status || "Unpaid"}
                  </span>
                </div>
              </div>

              <div className="mt-7 sm:mt-8">
                <h3 className="mb-6 text-lg font-bold text-white sm:mb-8 sm:text-xl">
                  Delivery Progress
                </h3>

                <div className="relative flex min-w-full items-start justify-between gap-2 overflow-x-auto pb-3">
                  <div className="absolute left-0 top-5 h-1 w-full min-w-96 rounded-full bg-zinc-800 sm:min-w-140" />

                  <div
                    className={`absolute left-0 top-5 h-1 rounded-full bg-linear-to-r from-yellow-700 via-yellow-500 to-yellow-300 shadow-[0_0_18px_rgba(234,179,8,0.35)] transition-all duration-1800 ease-out ${
                      request.status === "Submitted"
                        ? "w-[8%]"
                        : request.status === "In Progress"
                        ? "w-[36%]"
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

                      const isCorrection = Boolean(request.corrected_at);

                      const stepTime =
                        step === "Submitted"
                          ? isCorrection
                            ? request.corrected_at
                            : request.created_at
                          : step === "In Progress"
                          ? request.started_at
                          : step === "Ready"
                          ? request.ready_at
                          : request.delivered_at;

                      return (
                        <div
                          key={step}
                          className="relative z-10 flex min-w-24 flex-col items-center sm:min-w-28"
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

                          <div className="mt-3 text-center">
                            <p
                              className={`text-xs font-semibold sm:text-sm ${
                                active ? "text-yellow-400" : "text-gray-500"
                              }`}
                            >
                              {step === "Submitted" && isCorrection
                                ? "Correction Submitted"
                                : step}
                            </p>

                            <p className="mt-1 text-xs leading-relaxed text-gray-500">
                              {formatStepTime(stepTime)}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {request.status !== "Delivered" && (
                <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:mt-6 sm:p-5">
                  <p className="font-bold text-yellow-500">
                    Estimated Delivery
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-300 sm:text-base">
                    {request.status === "Submitted"
                      ? request.correction_notes
                        ? "Your correction request is waiting for review. Estimated completion: within 1 day."
                        : "Your request is waiting for work assignment. Estimated completion: within 1 day."
                      : request.status === "In Progress"
                      ? "Your paper formatting is in progress. Estimated completion: today."
                      : request.status === "Ready"
                      ? "Your paper is completed and waiting for payment / download."
                      : ""}
                  </p>
                </div>
              )}

              {request.preview_url && request.status !== "In Progress" && (
                <div className="mt-7 flex flex-col items-center sm:mt-8">
                  <p className="mb-4 text-lg font-bold text-yellow-500">
                    Final Paper Preview
                  </p>

                  <div className="group relative w-full max-w-xs overflow-hidden rounded-xl border border-yellow-500/20 bg-black p-2 sm:max-w-md sm:rounded-2xl">
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/paper-previews/${request.preview_url}`}
                      alt="Final Paper Preview"
                      className="h-auto w-full rounded-xl transition-all duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>
              )}

              {request.payment_status === "Partially Paid" &&
                request.final_pdf_url && (
                  <div className="mt-5 rounded-2xl border border-orange-500/30 bg-zinc-950 p-4 sm:mt-6 sm:p-6">
                    <p className="text-lg font-bold text-orange-400 sm:text-xl">
                      Additional Pages Added After Correction
                    </p>

                    <p className="mt-3 text-sm leading-6 text-gray-300 sm:text-base">
                      Your corrected question paper now contains more pages than
                      the previously paid final PDF. Your previous payment is
                      still valid. Only the extra pages are charged.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <p>
                        <b>Paid Pages:</b> {request.paid_page_count || 0}
                      </p>

                      <p>
                        <b>Final Pages:</b> {request.page_count || 0}
                      </p>

                      <p>
                        <b>Extra Pages:</b> {request.extra_pages || 0}
                      </p>

                      <p>
                        <b>Extra:</b> ₹{request.extra_amount_due || 0}
                      </p>
                    </div>

                    {request.payment_note && (
                      <p className="mt-4 rounded-xl border border-yellow-500/10 bg-black/40 p-3 text-sm text-gray-300 sm:p-4">
                        {request.payment_note}
                      </p>
                    )}

                    <button
                      onClick={() => payNow(request)}
                      disabled={paymentLoading}
                      className="mt-5 w-full rounded bg-yellow-500 px-5 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50 sm:w-auto"
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
                  <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-zinc-950 p-4 sm:mt-6 sm:p-6">
                    <p className="text-lg font-bold text-yellow-500 sm:text-xl">
                      Your paper is ready
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-400 sm:text-base">
                      Preview is available above. Complete payment to unlock the
                      final PDF.
                    </p>

                    <div className="mt-4 space-y-1 text-sm">
                      <p>Final Pages: {request.page_count || 0}</p>
                      <p>Amount: ₹{payableAmount}</p>
                      <p className="break-all">Request ID: {request.request_id}</p>

                      <button
                        onClick={() => payNow(request)}
                        disabled={paymentLoading || payableAmount <= 0}
                        className="mt-4 w-full rounded bg-yellow-500 px-5 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50 sm:w-auto"
                      >
                        {paymentLoading
                          ? "Opening Payment..."
                          : `Pay ₹${payableAmount} Now`}
                      </button>
                    </div>
                  </div>
                )}

              {request.payment_status === "Paid" && request.final_pdf_url && (
                <div className="mt-5 rounded-2xl border border-green-500/30 bg-zinc-950 p-4 sm:mt-6 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-bold text-green-400 sm:text-xl">
                        ✓ Final Paper Ready
                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-400 sm:text-base">
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

              {delivered &&
                !request.correction_notes &&
                request.payment_status === "Paid" &&
                Number(request.extra_amount_due || 0) === 0 && (
                  <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:mt-6 sm:p-6">
                    <p className="text-lg font-bold text-yellow-500 sm:text-xl">
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
                            corrected_at: new Date().toISOString(),
                            started_at: null,
                            ready_at: null,
                            delivered_at: null,
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
                                  corrected_at: new Date().toISOString(),
                                  started_at: null,
                                  ready_at: null,
                                  delivered_at: null,
                                }
                              : item
                          )
                        );

                        setCorrectionNotes("");

                        showToast("Latest correction note submitted successfully.");
                      }}
                      disabled={correctionLoading}
                      className="mt-3 w-full rounded bg-yellow-500 px-4 py-2 text-black disabled:opacity-50 sm:w-auto"
                    >
                      {correctionLoading
                        ? "Submitting..."
                        : "Request Correction"}
                    </button>
                  </div>
                )}

              {request.correction_notes && (
                <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:mt-6 sm:p-6">
                  <p className="font-bold text-yellow-500">
                    Correction Submitted
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-400 sm:text-base">
                    Your latest correction note has been received. We will
                    review the details and update you once the corrected paper is
                    ready. Thank you for your patience.
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {searched && requests.length === 0 && (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center sm:p-8">
            <p className="text-xl font-bold text-red-400">
              ⚠ Request Not Found
            </p>

            <p className="mt-3 text-sm leading-6 text-gray-400 sm:text-base">
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