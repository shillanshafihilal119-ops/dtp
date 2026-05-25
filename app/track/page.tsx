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

  async function searchRequests(e: React.FormEvent) {
  e.preventDefault();

  if (!phone && !requestId)
    {
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

  

  return (
    <main className="min-h-screen p-4 sm:p-10">
      {loading && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-black border border-yellow-500 p-6 rounded-lg">
      <p className="text-yellow-400 text-lg">
        Searching Request...
      </p>
    </div>
  </div>
)}
      <h1 className="text-3xl text-yellow-500 font-bold mb-6">
        Track Your Paper
      </h1>

      <form
      onSubmit={searchRequests}
      className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        <input
          type="text"
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "")) }
          maxLength={12}
          className="border p-3 rounded w-full"
        />

        <input
         type="text"
          placeholder="Enter Request ID"
         value={requestId}
        onChange={(e) =>
        setRequestId(
        e.target.value
        .toUpperCase()
        .replace(
        /[^A-Z0-9-]/g,
        ""
      )
  )
}
        maxLength={20}
        className="border p-3 rounded w-full"
/>

        <button
  disabled={loading}
  className="bg-yellow-500 text-black bold px-5 py-3 rounded disabled:opacity-50"
>
  {loading ? "Searching..." : "Search"}
</button>

      </form>

      <div className="grid gap-5">
        {requests.map((request) => (
          <div key={request.id} className="border p-5 rounded">
            <p>Class: {request.class}</p>
            <p>Subject: {request.subject}</p>
            <p>Session: {request.session}</p>
            <p>Examination: {request.examination}</p>
            <p>Marks: {request.marks}</p>
            <p>Duration: {request.duration}</p>
            <p>Medium: {request.medium}</p>
            <p>Status: {request.status}</p>
            <p>School: {request.school}</p>

            <div className="mt-6 border p-4 rounded">
  <h3 className="font-bold mb-4">
    Delivery Progress
  </h3>

  <div className="space-y-3">

    <p
      className={
        request.status ===
          "Submitted" ||
        request.status ===
          "In Progress" ||
        request.status ===
          "Ready" ||
        request.status ===
          "Delivered"

          ? "text-green-500"

          : "text-gray-400"
      }
    >
      ✓ Request Submitted
    </p>

    <p
      className={
        request.status ===
          "In Progress" ||
        request.status ===
          "Ready" ||
        request.status ===
          "Delivered"

          ? "text-green-500"

          : "text-gray-400"
      }
    >
      ✓ Work Started
    </p>

    <p
      className={
        request.status ===
          "Ready" ||
        request.status ===
          "Delivered"

          ? "text-green-500"

          : "text-gray-400"
      }
    >
      ✓ Final PDF Ready
    </p>

    <p
      className={
        request.payment_status ===
        "Paid"

          ? "text-green-500"

          : "text-gray-400"
      }
    >
      ✓ Payment Completed
    </p>

    <p
      className={
        request.status ===
        "Delivered"

          ? "text-green-500"

          : "text-gray-400"
      }
    >
      ✓ Delivered
    </p>

  </div>
</div>

            {request.preview_url && (
  <div className="mt-4">
    <p className="mb-2 font-semibold">
      Paper Preview
    </p>

    <img
      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/paper-previews/${request.preview_url}`}
      alt="Paper Preview"
      className="mt-4 rounded border w-full max-w-md"
    />
  </div>
)}

{loading && (
  <p className="mb-6 text-blue-500">
    Searching request...
  </p>
)}

            {request.final_pdf_url && request.payment_status === "Paid" && request.status === "Ready" && (
  <div className="mt-4 border p-4 rounded bg-yellow-50 text-black">
    <p className="font-semibold">
      Your paper is ready.
    </p>

    <p className="mt-2">
      Preview is available above. Complete payment to unlock the final PDF.
    </p>

    <div className="mt-4">
      <p>
        Amount: ₹49
      </p>

      <p>
        Request ID: {request.request_id}
      </p>

      <p>
        UPI ID: shillanshafihilal119@okhdfcbank
      </p>

      <p>
        After payment, send screenshot on WhatsApp.
      </p>

      <a
        href="https://wa.me/917889410756?text=I%20have%20completed%20the%20payment%20for%20my%20paper%20request.%20My%20Request%20ID%20is%20{request.request_id}."
        target="_blank"
        className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded"
      >
        Send Payment Screenshot
      </a>
    </div>
  </div>
)}

          {request.final_pdf_url && request.payment_status === "Paid" && (
  <a
  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/final-papers/${request.final_pdf_url}`}
  target="_blank"
  onClick={async () => {
    await supabase
      .from("paper_requests")
      .update({
        status: "Delivered",
      })
      .eq(
        "id",
        request.id
      );

    setRequests((prev) =>
      prev.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status:
                "Delivered",
            }
          : item
      )
    );
  }}

  className="
  inline-block
  bg-yellow-500
  text-black
  px-4
  py-2
  rounded
  mt-3
  font-semibold
  "
>
  Download Final Paper
</a>
)}
{request.status === "Delivered" && (
  <>
    <textarea
      placeholder="Need corrections? Write here..."
      value={correctionNotes}
      onChange={(e) =>
        setCorrectionNotes(
          e.target.value
        )
      }
      className="
      border
      p-3
      rounded
      w-full
      mt-4
      "
    />

    <button
      onClick={async () => {
        if (
          !correctionNotes.trim()
        ) {
          alert(
            "Please write correction details first."
          );

          return;
        }

        await supabase
          .from(
            "paper_requests"
          )

          .update({
            status:
              "In Progress",

            payment_status:
              "Unpaid",

            final_pdf_url:
              null,

            correction_notes:
              correctionNotes,
          })

          .eq(
            "request_id",
            request.request_id
          );

        alert(
          "Correction request submitted."
        );

        location.reload();
      }}

      className="
      bg-yellow-500
      text-black
      px-4
      py-2
      rounded
      mt-3
      "
    >
      Request Correction
    </button>
  </>
)}
</div>
))}

        {searched && requests.length === 0 && (
  <p className="mt-6 text-red-500">
    No request found. Please check your phone number or request ID.
  </p>
)}

      </div>
    </main>
  );
}