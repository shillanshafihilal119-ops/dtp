"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TrackPage() {
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState("");
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionText, setCorrectionText] = useState("");

  async function searchRequests(e: React.FormEvent) {
    e.preventDefault();

    if (!phone && !requestId) {
      alert("Please enter phone number or request ID.");
      return;
    }

    setSearched(false);
    setLoading(true);

    const { data, error } = await supabase
      .from("paper_requests")
      .select("*")
      .or(`phone.eq.${phone},request_id.eq.${requestId}`)
      .order("created_at", { ascending: false });

    setLoading(false);
    setSearched(true);

    if (error) {
      alert("Could not find requests");
      console.log(error);
    } else {
      setRequests(data || []);
    }
  }

async function submitCorrection(id: number) {
  if (!correctionText.trim()) {
    alert("Enter correction details");
    return;
  }

  const { error } = await supabase
    .from("paper_requests")
    .update({
  correction_notes: correctionText,
  status: "In Progress",
  final_pdf_url: null,
  preview_url: null,
  payment_status: "Unpaid",
})
    .eq("id", id);

  if (error) {
    alert("Failed to submit correction");
  } else {
    alert("Correction submitted");

    setCorrectionText("");

    window.location.reload();
  }
}

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10 animate-fade-in">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-lg border border-yellow-500 bg-black p-6">
            <p className="text-lg text-yellow-400">
              Searching Request...
            </p>
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
          Enter your phone number or request ID to check status, preview,
          payment, and final PDF delivery.
        </p>
      </section>

      <form
        onSubmit={searchRequests}
        className="mx-auto mb-10 flex max-w-6xl flex-col gap-3 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 sm:flex-row"
      >
        <input
          type="text"
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value.replace(/\D/g, ""))
          }
          maxLength={12}
          className="w-full rounded border p-3"
        />

<div className="flex items-center justify-center px-2">

<p className="
text-sm
font-semibold
text-white
whitespace-nowrap
">
OR
</p>

</div>

        <input
          type="text"
          placeholder="Enter Request ID"
          value={requestId}
          onChange={(e) =>
            setRequestId(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9-]/g, "")
            )
          }
          maxLength={20}
          className="w-full rounded border p-3"
        />

        <button
disabled={
loading ||
(!phone.trim() &&
!requestId.trim())
}

className="
rounded
bg-yellow-500
px-5
py-3
font-bold
text-black
transition
hover:bg-yellow-400
disabled:opacity-50
disabled:cursor-not-allowed
"
>

{loading
? "Searching..."
: "Search"}

</button>
      </form>

      <p className="mx-auto -mt-6 mb-8 max-w-6xl text-sm text-gray-400">
  You can search with either your phone number or your Request ID. Both are not required.
</p>

      <div className="grid gap-5">
        {requests.map((request) => {
          const delivered =
            request.status === "Delivered" &&
            request.payment_status === "Paid";

          return (
            <div
              key={request.id}
              className="mx-auto w-full max-w-6xl rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 shadow-lg"
            >
              <div className="grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-4">
  <p className="text-xs uppercase tracking-wide text-gray-500">
    School
  </p>

  <p className="mt-1 font-semibold text-white">
    {request.school}
  </p>
</div>

<div className="rounded-xl border border-yellow-500/10 bg-black/40 p-4">
  <p className="text-xs uppercase tracking-wide text-gray-500">
    Class
  </p>

  <p className="mt-1 font-semibold text-white">
    {request.class}
  </p>
</div>

<div className="rounded-xl border border-yellow-500/10 bg-black/40 p-4">
  <p className="text-xs uppercase tracking-wide text-gray-500">
    Subject
  </p>

  <p className="mt-1 font-semibold text-white">
    {request.subject}
  </p>
</div>

<div className="rounded-xl border border-yellow-500/10 bg-black/40 p-4">
  <p className="text-xs uppercase tracking-wide text-gray-500">
    Session
  </p>

  <p className="mt-1 font-semibold text-white">
    {request.session}
  </p>
</div>

<div className="rounded-xl border border-yellow-500/10 bg-black/40 p-4">
  <p className="text-xs uppercase tracking-wide text-gray-500">
    Examination
  </p>

  <p className="mt-1 font-semibold text-white">
    {request.examination}
  </p>
</div>

<div className="rounded-xl border border-yellow-500/10 bg-black/40 p-4">
  <p className="text-xs uppercase tracking-wide text-gray-500">
    Marks
  </p>

  <p className="mt-1 font-semibold text-white">
    {request.marks}
  </p>
</div>

<div className="rounded-xl border border-yellow-500/10 bg-black/40 p-4">
  <p className="text-xs uppercase tracking-wide text-gray-500">
    Duration
  </p>

  <p className="mt-1 font-semibold text-white">
    {request.duration}
  </p>
</div>

<div className="rounded-xl border border-yellow-500/10 bg-black/40 p-4">
  <p className="text-xs uppercase tracking-wide text-gray-500">
    Medium
  </p>

  <p className="mt-1 font-semibold text-white">
    {request.medium}
  </p>
</div>
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
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {request.payment_status}
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

                  {[
                    "Submitted",
                    "In Progress",
                    "Ready",
                    "Delivered",
                  ].map((step) => {
                    const active =
                      step === request.status ||
                      request.status === "Delivered" ||
                      (request.status === "Ready" &&
                        step !== "Delivered") ||
                      (request.status === "In Progress" &&
                        (step === "Submitted" ||
                          step === "In Progress"));

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

                        <p className="mt-3 text-center text-xs">
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

             {request.preview_url &&
  request.status !== "In Progress" && (
    <div className="mt-8 flex flex-col items-center">
      <p className="mb-4 text-lg font-bold text-yellow-500">
        Formatted Preview
      </p>

      <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-black p-2 max-w-md w-full">
        <img
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/paper-previews/${request.preview_url}`}
          alt="Formatted Preview"
          className="w-full rounded-xl transition-all duration-700 group-hover:scale-105"
        />
      </div>
    </div>
  )}

              {request.final_pdf_url &&
                request.payment_status !== "Paid" && (
                  <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-zinc-950 p-6">
                    <p className="text-xl font-bold text-yellow-500">
                      Your paper is ready
                    </p>

                    <p className="mt-2 text-gray-400">
                      Preview is available above. Complete payment to unlock
                      the final PDF.
                    </p>

                    <div className="mt-4 space-y-1 text-sm">
                      <p>Amount: ₹49</p>
                      <p>Request ID: {request.request_id}</p>
                      <p>
                        UPI ID:
                        shillanshafihilal119@okhdfcbank
                      </p>
                      <p>
                        After payment, send screenshot on WhatsApp.
                      </p>

                      <a
                        href={`https://wa.me/917889410756?text=${encodeURIComponent(
                          `I have completed the payment for my paper request. My Request ID is ${request.request_id}.`
                        )}`}
                        target="_blank"
                        className="inline-block rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-500"
                      >
                        Send Payment Screenshot
                      </a>
                    </div>
                  </div>
                )}

              {request.payment_status === "Paid" &&
                request.final_pdf_url && (
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

                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/final-papers/${request.final_pdf_url}`}
                        target="_blank"
                        onClick={async () => {
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
                        }}
                        className="rounded-xl bg-green-500 px-5 py-3 font-semibold text-black transition hover:bg-green-400"
                      >
                        Download Final PDF
                      </a>
                    </div>
                  </div>
                )}

              {delivered && (
                <>
                  <textarea
                    placeholder="Need corrections? Write here..."
                    value={correctionNotes}
                    onChange={(e) =>
                      setCorrectionNotes(e.target.value)
                    }
                    className="mt-4 w-full rounded border p-3"
                  />

                  <button
                    onClick={async () => {
                      if (!correctionNotes.trim()) {
                        alert(
                          "Please write correction details first."
                        );
                        return;
                      }

                      setCorrectionLoading(true);

                      await supabase
                        .from("paper_requests")
                        .update({
                          status: "In Progress",
                          payment_status: "Unpaid",
                          final_pdf_url: null,
                          correction_notes: correctionNotes,
                        })
                        .eq("request_id", request.request_id);

                      setCorrectionLoading(false);

                      alert("Correction request submitted.");

                      location.reload();
                    }}
                    disabled={correctionLoading}
                    className="mt-3 rounded bg-yellow-500 px-4 py-2 text-black disabled:opacity-50"
                  >
                    {correctionLoading
                      ? "Submitting..."
                      : "Request Correction"}
                  </button>
                </>
              )}
            </div>
          );
        })}

        {searched && requests.length === 0 && (
          <div className="
mx-auto
mt-10
max-w-xl
rounded-2xl
border
border-red-500/20
bg-red-500/5
p-8
text-center
">

<p className="
text-xl
font-bold
text-red-400
">
⚠ Request Not Found
</p>

<p className="
mt-3
text-gray-400
">
We could not find any request matching the phone number or Request ID entered.
</p>

<p className="
mt-2
text-sm
text-gray-500
">
Please verify your details and try again.
</p>

</div>
        )}
      </div>
    </main>
  );
}