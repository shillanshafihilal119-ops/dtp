"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PDFDocument } from "pdf-lib";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [correctionFilter, setCorrectionFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState("");

  const router = useRouter();

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  function formatAdminDate(value: string | null | undefined) {
    if (!value) return "Pending";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    fetchRequests();
    fetchPricing();
  }, [router]);

  async function fetchPricing() {
    const { data, error } = await supabase
      .from("pricing_settings")
      .select("*")
      .order("medium", { ascending: true });

    if (error) {
      console.log(error);
    } else {
      setPrices(data || []);
    }
  }

  async function savePricing() {
    try {
      setSavingPrices(true);

      const res = await fetch("/api/admin-pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": process.env.NEXT_PUBLIC_ADMIN_PASSWORD!,
        },
        body: JSON.stringify({ prices }),
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.error || "Failed to update pricing");
        return;
      }

      showToast("Pricing updated successfully");
      fetchPricing();
    } catch (error) {
      console.log(error);
      alert("Failed to update pricing");
    } finally {
      setSavingPrices(false);
    }
  }

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("paper_requests")
      .select("*")
      .neq("status", "Delivered")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setRequests(data || []);
    }
  }

  async function updateStatus(request: any, status: string) {
    
    if (status === "Delivered" && request.payment_status !== "Paid") {
  alert("Cannot mark as delivered until payment is paid.");
  return;
}

if (status === "Ready" && !request.final_pdf_url) {
  alert("Upload the final PDF before marking this request as ready.");
  return;
}

    setLoading(true);

    const updateData: any = { status };

    if (status === "In Progress") {
      updateData.started_at = new Date().toISOString();
    }

    if (status === "Ready") {
      updateData.ready_at = new Date().toISOString();
    }

    if (status === "Delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("paper_requests")
      .update(updateData)
      .eq("id", request.id);

    setLoading(false);

    if (error) {
      console.log(error);
      alert("Failed to update status");
    } else {
      showToast("Status updated successfully");
      fetchRequests();
    }
  }

  async function updatePaymentStatus(request: any, payment_status: string) {
    setLoading(true);

    const updateData: any = { payment_status };

    if (payment_status === "Paid") {
      updateData.paid_page_count = request.page_count || 0;
      updateData.paid_amount = request.total_amount || 0;
      updateData.extra_pages = 0;
      updateData.extra_amount_due = 0;
      updateData.payment_note = null;
    }

    if (payment_status === "Unpaid") {
      updateData.paid_page_count = 0;
      updateData.paid_amount = 0;
      updateData.extra_pages = 0;
      updateData.extra_amount_due = 0;
      updateData.payment_note = null;
    }

    const { error } = await supabase
      .from("paper_requests")
      .update(updateData)
      .eq("id", request.id);

    setLoading(false);

    if (error) {
      console.log(error);
      alert("Failed to update payment");
    } else {
      showToast("Payment status updated successfully");
      fetchRequests();
    }
  }

  async function uploadPreview(id: number, file: File) {
    setLoading(true);

    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("paper-previews")
      .upload(fileName, file);

    if (error) {
      console.log(error);
      alert("Preview upload failed");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("paper_requests")
      .update({ preview_url: data.path })
      .eq("id", id);

    setLoading(false);

    if (updateError) {
      console.log(updateError);
      alert("Failed to save preview");
    } else {
      showToast("Preview image uploaded successfully");
      fetchRequests();
    }
  }

  async function uploadFinalPdf(id: number, file: File, request: any) {
    setLoading(true);

    try {
      const oldPageCount = Number(request.page_count || 0);
      const paidPageCount = Number(request.paid_page_count || 0);
      const pagesAlreadyPaidFor =
        paidPageCount > 0 ? paidPageCount : oldPageCount;

      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pageCount = pdf.getPageCount();

      const { data: priceRow, error: priceError } = await supabase
        .from("pricing_settings")
        .select("*")
        .eq("medium", request.medium)
        .single();

      if (priceError || !priceRow) {
        console.log(priceError);
        alert(`Pricing not found for ${request.medium}`);
        setLoading(false);
        return;
      }

      const rate = Number(priceRow.rate_per_page);
      const totalAmount = pageCount * rate;
      const fileName = `${Date.now()}-${file.name}`;

      if (request.final_pdf_url) {
        await supabase.storage
          .from("final-papers")
          .remove([request.final_pdf_url]);
      }

      const { data, error } = await supabase.storage
        .from("final-papers")
        .upload(fileName, file, { upsert: true });

      if (error) {
        console.log(error);
        alert("PDF upload failed");
        setLoading(false);
        return;
      }

      let updateData: any = {
  final_pdf_url: data.path,
  status: "Ready",
  ready_at: new Date().toISOString(),
  page_count: pageCount,
  total_amount: totalAmount,
};

      if (request.payment_status === "Paid" && pageCount > pagesAlreadyPaidFor) {
        const extraPages = pageCount - pagesAlreadyPaidFor;
        const extraAmount = extraPages * rate;

        updateData = {
          ...updateData,
          payment_status: "Partially Paid",
          extra_pages: extraPages,
          extra_amount_due: extraAmount,
          payment_note: `Your corrected paper now contains additional pages. Previous paid pages: ${pagesAlreadyPaidFor}. Updated final pages: ${pageCount}. Additional pages: ${extraPages}. Only the additional pages are charged. Previous payment remains valid.`,
        };
      }

      if (request.payment_status === "Paid" && pageCount <= pagesAlreadyPaidFor) {
        updateData = {
          ...updateData,
          extra_pages: 0,
          extra_amount_due: 0,
          payment_note: null,
        };
      }

      const { error: updateError } = await supabase
        .from("paper_requests")
        .update(updateData)
        .eq("id", id);

      setLoading(false);

      if (updateError) {
        console.log(updateError);
        alert("Failed to save PDF");
      } else {
        showToast(`Final PDF uploaded • ${pageCount} pages • ₹${totalAmount}`);
        fetchRequests();
        fetchPricing();
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert("PDF processing failed");
    }
  }

  async function deleteRequest(id: number) {
    setLoading(true);

    const { error } = await supabase
      .from("paper_requests")
      .delete()
      .eq("id", id);

    setLoading(false);

    if (error) {
      console.log(error);
      alert("Failed to delete request");
    } else {
      setDeleteId(null);
      setShowDeleteModal(false);
      showToast("Request deleted successfully");
      fetchRequests();
    }
  }

  const filteredRequests = requests.filter((request: any) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      request.teacher_name?.toLowerCase().includes(searchText) ||
      request.phone?.toLowerCase().includes(searchText) ||
      request.class?.toLowerCase().includes(searchText) ||
      request.subject?.toLowerCase().includes(searchText) ||
      request.school?.toLowerCase().includes(searchText) ||
      request.request_id?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || request.status === statusFilter;

    const matchesPayment =
      paymentFilter === "All" || request.payment_status === paymentFilter;

    const matchesCorrection =
  correctionFilter === "All" ||
  (correctionFilter === "Corrections" && Boolean(request.correction_notes));

    return matchesSearch && matchesStatus && matchesPayment && matchesCorrection;
  });

  return (
    <>
      {showDeleteModal && (
        <div className="fixed inset-0 z-9999 flex items-start justify-center bg-black/80 p-6 pt-24">
          <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-950 p-5 shadow-2xl sm:p-8">
            <p className="text-2xl font-bold text-red-400">Delete Request?</p>
            <p className="mt-3 text-gray-400">This action cannot be undone.</p>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="flex-1 rounded border border-zinc-700 py-3"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (deleteId) deleteRequest(deleteId);
                }}
                className="flex-1 rounded bg-red-600 py-3 font-bold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen px-4 py-8 sm:px-10 sm:py-12 animate-fade-in">
        {toast && (
          <div className="fixed right-6 top-6 z-9999 rounded-2xl border border-green-500/20 bg-zinc-950 p-5 shadow-xl">
            <p className="font-bold text-green-400">✓ Success</p>
            <p className="mt-1 text-sm text-gray-300">{toast}</p>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="rounded-lg border border-yellow-500 bg-black p-6">
              <p className="text-lg text-yellow-400">Working...</p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-3 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400">
                Admin Panel
              </p>

              <h1 className="text-3xl font-bold text-yellow-500 sm:text-4xl">
                Admin Dashboard
              </h1>

              <p className="mt-2 text-gray-400">
                Manage active requests, uploads, payments, pricing, and corrections.
              </p>
            </div>

            <div className="grid gap-3 sm:flex">

              <a
                href="/archive"
                className="rounded bg-yellow-500 px-4 py-2 text-center font-semibold text-black hover:bg-yellow-400"
              >
                Archive
              </a>

              <button
                onClick={() => {
                  document.cookie =
                    "vintage_admin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  router.push("/admin-login");
                }}
                className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              [
                "Submitted",
                requests.filter((r) => r.status === "Submitted").length,
                "text-blue-400",
              ],
              [
                "In Progress",
                requests.filter((r) => r.status === "In Progress").length,
                "text-yellow-400",
              ],
              [
                "Ready",
                requests.filter((r) => r.status === "Ready").length,
                "text-orange-400",
              ],
              ["Corrections", requests.filter((r) => r.correction_notes).length, "text-orange-400"],

            ].map(([label, value, color]) => (
              <div
                key={label}
                className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-5"
              >
                <p className="text-sm text-gray-400">{label}</p>
                <p className={`mt-2 text-2xl font-bold sm:text-3xl ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4">
  <a
    href="/admin/pricing"
    className="group relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-linear-to-br from-yellow-500/15 via-zinc-950 to-zinc-950 p-4 sm:p-6 shadow-[0_0_24px_rgba(234,179,8,0.08)] transition hover:border-yellow-500/70 hover:shadow-[0_0_30px_rgba(234,179,8,0.16)]"
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-yellow-500/80">
          Manage Rates
        </p>

        <p className="mt-2 text-lg font-bold text-yellow-400 sm:text-2xl">
          Pricing Settings
        </p>

        <p className="mt-2 text-sm text-gray-400">
          Update per-page rates for every medium.
        </p>
      </div>

      <span className="hidden h-12 w-12 items-center justify-center rounded-xl bg-yellow-500 text-2xl font-black text-black transition group-hover:scale-105 sm:flex">
        ₹
      </span>
    </div>
  </a>

  <a
    href="/admin/payments"
    className="group relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-linear-to-br from-emerald-500/12 via-zinc-950 to-zinc-950 p-4 sm:p-6 shadow-[0_0_24px_rgba(16,185,129,0.07)] transition hover:border-emerald-500/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.14)]"
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-400/80">
          Money Log
        </p>

        <p className="mt-2 text-lg font-bold text-emerald-400 sm:text-2xl">
          Payment History
        </p>

        <p className="mt-2 text-sm text-gray-400">
          Review payments, attempts, and extra charges.
        </p>
      </div>

      <span className="hidden h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-2xl font-black text-black transition group-hover:scale-105 sm:flex">
        ₹
      </span>
    </div>
  </a>
</div>

          <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="text"
                placeholder="Search requests"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded border border-yellow-500/20 bg-black/60 p-3 text-white placeholder:text-gray-500 outline-none focus:border-yellow-500"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border bg-grey p-3 text-white focus:bg-yellow-500 focus:text-black"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready">Ready</option>
                <option value="Delivered">Delivered</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="rounded border bg-grey p-3 text-white focus:bg-yellow-500 focus:text-black"
              >
                <option value="All">All Payments</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>

              <select
                value={correctionFilter}
                onChange={(e) => setCorrectionFilter(e.target.value)}
                className="rounded border bg-grey p-3 text-white focus:bg-yellow-500 focus:text-black"
              >
                <option value="All">All Requests</option>
                <option value="Corrections">Corrections Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {filteredRequests.map((request: any) => {
              const uploadedPaperUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/paper-uploads/${request.file_url}`;

              const timeline = request.correction_notes
                ? [
                    [
                      "Correction",
                      request.corrected_at,
                      Boolean(request.corrected_at),
                    ],
                    [
                      "Restarted",
                      request.started_at,
                      request.status === "In Progress" ||
                        request.status === "Ready" ||
                        request.status === "Delivered",
                    ],
                    [
                      "Ready Again",
                      request.ready_at,
                      request.status === "Ready" ||
                        request.status === "Delivered",
                    ],
                    [
                      "Delivered",
                      request.delivered_at,
                      request.status === "Delivered",
                    ],
                  ]
                : [
                    [
                      "Submitted",
                      request.created_at,
                      Boolean(request.created_at),
                    ],
                    [
                      "Started",
                      request.started_at,
                      request.status === "In Progress" ||
                        request.status === "Ready" ||
                        request.status === "Delivered",
                    ],
                    [
                      "Ready",
                      request.ready_at,
                      request.status === "Ready" ||
                        request.status === "Delivered",
                    ],
                    [
                      "Delivered",
                      request.delivered_at,
                      request.status === "Delivered",
                    ],
                  ];

              return (
                <div
                  key={request.id}
                  className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 shadow-lg sm:p-6"
                >
                  <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
  <h2 className="text-xl font-bold sm:text-2xl">
    {request.teacher_name}
  </h2>

  {request.correction_notes && (
    <span className="w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
      Correction
    </span>
  )}
</div>

                      <p className="mt-2 text-sm text-gray-400">
                        Request ID: {request.request_id}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                    </div>
                  </div>

                  {request.correction_notes && (
                    <div className="mb-5 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 sm:mb-6 sm:p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-lg font-bold text-orange-400">
                            Correction Requested
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Submitted: {formatAdminDate(request.corrected_at)}
                          </p>
                        </div>

                        <span className="w-fit rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-black">
                          Needs Review
                        </span>
                      </div>

                     <p className="mt-3 rounded-lg border border-orange-500/10 bg-black/40 p-3 text-sm leading-relaxed text-gray-300 sm:mt-4 sm:p-4">
                        {request.correction_notes}
                      </p>
                    </div>
                  )}

                  {request.payment_note && (
                    <div className="mb-6 rounded-xl border border-orange-500/20 bg-black/40 p-4">
                      <p className="font-semibold text-orange-400">
                        Extra Payment Note
                      </p>

                      <p className="mt-2 text-sm text-gray-300">
                        {request.payment_note}
                      </p>
                    </div>
                  )}

                  {request.status === "Ready" && request.payment_status === "Unpaid" && (
  <div className="mb-5 rounded-xl border border-red-500/25 bg-red-500/5 p-3 sm:mb-6 sm:p-4">
    <p className="font-semibold text-red-400">
      Payment Pending
    </p>

    <p className="mt-2 text-sm text-gray-300">
      Final PDF is ready, but the customer has not completed payment yet.
    </p>
  </div>
)}

                  <div className="mb-6 grid grid-cols-2 gap-3 text-sm sm:gap-4 lg:grid-cols-3">
                    <p>
                      <b>Phone:</b> {request.phone}
                    </p>
                    <p>
                      <b>School:</b> {request.school}
                    </p>
                    <p>
                      <b>Class:</b> {request.class}
                    </p>
                    <p>
                      <b>Subject:</b> {request.subject}
                    </p>
                    <p>
                      <b>Session:</b> {request.session}
                    </p>
                    <p>
                      <b>Exam:</b> {request.examination}
                    </p>
                    <p>
                      <b>Marks:</b> {request.marks}
                    </p>
                    <p>
                      <b>Duration:</b> {request.duration}
                    </p>
                    <p>
                      <b>Medium:</b> {request.medium}
                    </p>
                    <p>
                      <b>Pages:</b> {request.page_count || 0}
                    </p>
                    <p>
                      <b>Total Amount:</b> ₹{request.total_amount || 0}
                    </p>
                    <p>
                      <b>Extra Due:</b> ₹{request.extra_amount_due || 0}
                    </p>
                  </div>

                  <div className="mb-5 rounded-xl border border-yellow-500/10 bg-black/40 p-4 sm:mb-6 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold text-yellow-500">
                          Request Timeline
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {request.correction_notes
                            ? "Correction progress for this request."
                            : "Admin status timestamps shown in customer order flow."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      {timeline.map(([label, value, active]: any) => (
                        <div
                          key={label}
                          className={`rounded-xl border p-3 sm:p-4 ${
                            active
                              ? "border-yellow-500/30 bg-yellow-500/5"
                              : "border-zinc-800 bg-black/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                active
                                  ? "bg-yellow-500 text-black"
                                  : "bg-zinc-800 text-gray-500"
                              }`}
                            >
                              {active ? "✓" : "•"}
                            </span>

                            <div>
                              <p
                                className={`text-sm font-bold ${
                                  active ? "text-yellow-400" : "text-gray-500"
                                }`}
                              >
                                {label}
                              </p>

                              <p className="mt-1 text-xs leading-relaxed text-gray-400">
                                {formatAdminDate(value)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {request.instructions && (
                    <p className="mb-6 text-sm text-gray-300">
                      <b>Instructions:</b> {request.instructions}
                    </p>
                  )}

                  <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4">
                    <div>
                      <p className="mb-2 font-semibold text-yellow-400">
                        Status
                      </p>

                      <select
                        value={request.status}
                        onChange={(e) =>
                          updateStatus(request, e.target.value)
                        }
                        className="w-full rounded border bg-grey p-2.5 text-sm text-white focus:bg-yellow-500 focus:text-black sm:p-3 sm:text-base"
                      >
                        <option>Submitted</option>
                        <option>In Progress</option>
                        <option disabled={!request.final_pdf_url}>
  Ready
</option>
                        <option disabled={request.payment_status !== "Paid"}>
  Delivered
</option>
                      </select>

                      {request.payment_status !== "Paid" && (
  <p className="mt-2 text-xs text-gray-500">
    Delivery is locked until payment is marked Paid.
  </p>
)}

{!request.final_pdf_url && (
  <p className="mt-2 text-xs text-gray-500">
    Ready status unlocks only after final PDF upload.
  </p>
)}

                    </div>

                    <div>
                      <p className="mb-2 font-semibold text-yellow-400">
                        Payment
                      </p>

                      <select
                        value={request.payment_status || "Unpaid"}
                        onChange={(e) =>
                          updatePaymentStatus(request, e.target.value)
                        }
                        className="w-full rounded border bg-grey p-2.5 text-sm text-white focus:bg-yellow-500 focus:text-black sm:p-3 sm:text-base"
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                      </select>
                    </div>
                  </div>

                  {request.status === "Submitted" && (
  <button
    onClick={() => updateStatus(request, "In Progress")}
    className="mb-6 w-full rounded bg-yellow-500 p-3 font-semibold text-black hover:bg-yellow-400"
  >
    {request.correction_notes ? "Start Correction Work" : "Start Work"}
  </button>
)}

                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                    <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3 sm:p-4">
                      <p className="mb-3 font-semibold">Final PDF</p>

                      {request.final_pdf_url && (
                        <div className="mb-4">
                          <p className="mb-3 font-semibold text-green-400">
                            Final PDF uploaded
                          </p>

                          <a
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/final-papers/${request.final_pdf_url}`}
                            target="_blank"
                            className="mb-3 block rounded bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-500"
                          >
                            View Current Final PDF
                          </a>

                          <a
                            href={`https://wa.me/91${request.phone}?text=${encodeURIComponent(
                              `Vintage DTP

Hello ${request.teacher_name},

Your paper formatting work is completed.

Request ID: ${request.request_id}

Subject: ${request.subject}
Class: ${request.class}
Pages: ${request.page_count || 0}
Amount: ₹${request.total_amount || 0}
Payment Status: ${request.payment_status || "Unpaid"}

Please open the tracking page to preview the paper, complete payment if pending, and download the final PDF.

Track your paper here:
https://dtp-gules.vercel.app/track

Thank you for choosing Vintage DTP.`
                            )}`}
                            target="_blank"
                            className="mb-3 block rounded bg-green-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-green-500"
                          >
                            Notify Customer on WhatsApp
                          </a>
                        </div>
                      )}

                      <input
                        className="w-full rounded border border-yellow-500/20 bg-black/60 p-3 text-white"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            uploadFinalPdf(
                              request.id,
                              e.target.files[0],
                              request
                            );
                            e.currentTarget.value = "";
                          }
                        }}
                      />

                      <p className="mt-2 text-xs text-gray-500">
                        Upload again anytime to replace the current final PDF
                        and recalculate pages and amount.
                      </p>
                    </div>

                    <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3 sm:p-4">
                      <p className="mb-3 font-semibold">Preview Image</p>

                      <input
                        className="w-full rounded border border-yellow-500/20 bg-black/60 p-3 text-white"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            uploadPreview(request.id, e.target.files[0]);
                          }
                        }}
                      />

                      {request.preview_url && (
                        <div className="mt-5 flex flex-col items-center">
                          <p className="mb-3 text-sm text-yellow-400">
                            Current Preview
                          </p>

                          <div className="group relative max-w-sm overflow-hidden rounded-xl border border-yellow-500/20">
                            <img
                              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/paper-previews/${request.preview_url}`}
                              alt="Preview"
                              className="h-auto w-full transition-all duration-700 group-hover:scale-105"
                            />

                            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {request.file_url && (
  <div className="mt-5 flex flex-col items-center sm:mt-6">
                      <p className="mb-4 text-lg font-bold text-yellow-500">
                        Uploaded Paper
                      </p>

                      <div className="group relative w-full max-w-xs overflow-hidden rounded-xl border border-yellow-500/20 bg-black p-2 sm:max-w-md sm:rounded-2xl">
                        <img
                          src={uploadedPaperUrl}
                          alt="Uploaded paper"
                          className="h-auto w-full rounded-xl transition-all duration-700 group-hover:scale-105"
                        />

                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                      </div>

                      <a
                        href={uploadedPaperUrl}
                        target="_blank"
                        download
                        className="mt-4 rounded bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
                      >
                        Download Uploaded Paper
                      </a>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      setDeleteId(request.id);
                      setShowDeleteModal(true);
                    }}
                    className="mt-6 w-full rounded bg-red-600 p-3 font-semibold text-white hover:bg-red-500"
                  >
                    Delete Request
                  </button>
                </div>
              );
            })}

            {filteredRequests.length === 0 && (
              <p className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 shadow-lg sm:p-6">
                No active requests found.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}