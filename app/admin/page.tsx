"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [correctionFilter, setCorrectionFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const loginTime = localStorage.getItem("adminLoginTime");

    const expired =
      !loginTime ||
      Date.now() - Number(loginTime) > 24 * 60 * 60 * 1000;

    if (isAdmin !== "true" || expired) {
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("adminLoginTime");

  alert(
    expired
      ? "Admin session expired. Please login again."
      : "Please login first."
  );

  router.push("/admin-login");

  return;
}

    fetchRequests();
  }, [router]);

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("paper_requests")
      .select("*")
      .neq("status", "Delivered")
      .order("created_at", { ascending: false });

    if (error) console.log(error);
    else setRequests(data || []);
  }

  async function updateStatus(id: number, status: string) {
    setLoading(true);

    const { error } = await supabase
      .from("paper_requests")
      .update({ status })
      .eq("id", id);

    setLoading(false);

    if (error) {
      console.log(error);
      alert("Failed to update status");
    } else {
      fetchRequests();
    }
  }

  async function updatePaymentStatus(id: number, payment_status: string) {
    setLoading(true);

    const { error } = await supabase
      .from("paper_requests")
      .update({ payment_status })
      .eq("id", id);

    setLoading(false);

    if (error) {
      console.log(error);
      alert("Failed to update payment");
    } else {
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
      alert("Preview uploaded");
      fetchRequests();
    }
  }

  async function uploadFinalPdf(id: number, file: File) {
    setLoading(true);

    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("final-papers")
      .upload(fileName, file);

    if (error) {
      console.log(error);
      alert("PDF upload failed");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("paper_requests")
      .update({
        final_pdf_url: data.path,
        status: "Ready",
        correction_notes: null,
      })
      .eq("id", id);

    setLoading(false);

    if (updateError) {
      console.log(updateError);
      alert("Failed to save PDF");
    } else {
      alert("PDF uploaded");
      fetchRequests();
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

    alert("Request deleted");

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
      paymentFilter === "All" ||
      request.payment_status === paymentFilter;

    const matchesCorrection =
      correctionFilter === "All" || Boolean(request.correction_notes);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPayment &&
      matchesCorrection
    );
  });

  return (
  <>
    {showDeleteModal && (
      <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/80 p-6 pt-24">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-950 p-8 shadow-2xl">
          <p className="text-2xl font-bold text-red-400">
            Delete Request?
          </p>

          <p className="mt-3 text-gray-400">
            This action cannot be undone.
          </p>

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
                if (deleteId) {
                  deleteRequest(deleteId);
                }
              }}
              className="flex-1 rounded bg-red-600 py-3 font-bold text-white"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    <main className="min-h-screen px-6 py-12 sm:px-10 animate-fade-in">
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

            <h1 className="text-4xl font-bold text-yellow-500">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-gray-400">
              Manage active requests, uploads, payments, and corrections.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/archive"
              className="rounded bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
            >
              Archive
            </a>

            <button
              onClick={() => {
                localStorage.removeItem("isAdmin");
                localStorage.removeItem("adminLoginTime");
                router.push("/admin-login");
              }}
              className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Submitted</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {requests.filter((r) => r.status === "Submitted").length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">In Progress</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {requests.filter((r) => r.status === "In Progress").length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Ready</p>
            <p className="mt-2 text-3xl font-bold text-orange-400">
              {requests.filter((r) => r.status === "Ready").length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Corrections</p>
            <p className="mt-2 text-3xl font-bold text-green-400">
              {requests.filter((r) => r.correction_notes).length}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              placeholder="Search requests"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded border p-3"
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

            return (
              <div
                key={request.id}
                className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 shadow-lg"
              >
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {request.teacher_name}
                    </h2>

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
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {request.payment_status || "Unpaid"}
                    </span>
                  </div>
                </div>

                {request.correction_notes && (
                  <div className="mb-6 rounded-xl border border-yellow-500/20 bg-black/40 p-4">
                    <p className="font-semibold text-yellow-400">
                      Correction Request
                    </p>

                    <p className="mt-2 text-sm text-gray-300">
                      {request.correction_notes}
                    </p>
                  </div>
                )}

                <div className="mb-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <p><b>Phone:</b> {request.phone}</p>
                  <p><b>School:</b> {request.school}</p>
                  <p><b>Class:</b> {request.class}</p>
                  <p><b>Subject:</b> {request.subject}</p>
                  <p><b>Session:</b> {request.session}</p>
                  <p><b>Exam:</b> {request.examination}</p>
                  <p><b>Marks:</b> {request.marks}</p>
                  <p><b>Duration:</b> {request.duration}</p>
                  <p><b>Medium:</b> {request.medium}</p>
                </div>

                {request.instructions && (
                  <p className="mb-6 text-sm text-gray-300">
                    <b>Instructions:</b> {request.instructions}
                  </p>
                )}

                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 font-semibold text-yellow-400">
                      Status
                    </p>

                    <select
                      value={request.status}
                      onChange={(e) =>
                        updateStatus(request.id, e.target.value)
                      }
                      className="w-full rounded border bg-grey p-3 text-white focus:bg-yellow-500 focus:text-black"
                    >
                      <option>Submitted</option>
                      <option>In Progress</option>
                      <option>Ready</option>
                      <option>Delivered</option>
                    </select>
                  </div>

                  <div>
                    <p className="mb-2 font-semibold text-yellow-400">
                      Payment
                    </p>

                    <select
                      value={request.payment_status || "Unpaid"}
                      onChange={(e) =>
                        updatePaymentStatus(request.id, e.target.value)
                      }
                      className="w-full rounded border bg-grey p-3 text-white focus:bg-yellow-500 focus:text-black"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-4">
                    <p className="mb-3 font-semibold">Final PDF</p>

                    {!request.final_pdf_url ? (
                      <input
                        className="w-full rounded border p-3"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            uploadFinalPdf(request.id, e.target.files[0]);
                          }
                        }}
                      />
                    ) : (
                      <>
                        <p className="font-semibold text-green-400 mb-4">
Final PDF already uploaded
</p>

<div className="flex flex-col gap-3">

<a
href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/final-papers/${request.final_pdf_url}`}
target="_blank"

className="
rounded
bg-blue-600
px-4
py-3
text-center
font-semibold
text-white
transition
hover:bg-blue-500
"
>
View Final PDF
</a>

<a
  href={`https://wa.me/91${request.phone}?text=${encodeURIComponent(
    `Vintage DTP

Hello ${request.teacher_name},

Your paper formatting work is completed.

Request ID: ${request.request_id}

Subject: ${request.subject}
Class: ${request.class}

Track your paper here:
https://dtp-gules.vercel.app/track

Payment Status:
${request.payment_status || "Unpaid"}

Thank you for choosing Vintage DTP.`
  )}`}
  target="_blank"
  className="rounded bg-green-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-green-500"
>
  Notify Customer on WhatsApp
</a>

</div>

                      </>
                    )}
                  </div>

                  <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-4">

<p className="mb-3 font-semibold">
Preview Image
</p>

<input
className="w-full rounded border p-3"
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

className="
w-full
transition-all
duration-700
group-hover:scale-105
"
/>

<div className="
pointer-events-none
absolute
inset-0
bg-gradient-to-t
from-black/40
to-transparent
opacity-0
group-hover:opacity-100
transition
"/>

</div>

</div>

)}

</div>
                </div>

                {request.file_url && (
                  <div className="mt-6 flex flex-col items-center">
                    <p className="mb-4 text-lg font-bold text-yellow-500">
                      Uploaded Paper
                    </p>

                    <div className="group relative w-full max-w-md overflow-hidden rounded-2xl border border-yellow-500/20 bg-black p-2">
                      <img
                        src={uploadedPaperUrl}
                        alt="Uploaded paper"
                        className="w-full rounded-xl transition-all duration-700 group-hover:scale-105"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
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
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

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
            <p className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 text-gray-400">
              No active requests found.
            </p>
          )}
        </div>
      </div>
    </main>
  </>
  );
}