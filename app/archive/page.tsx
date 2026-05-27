"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ArchivePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    fetchDelivered();
  }, []);

  async function fetchDelivered() {
    const { data, error } = await supabase
      .from("paper_requests")
      .select("*")
      .eq("status", "Delivered")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setRequests(data || []);
    }
  }

  function handleSearch() {
    if (!search.trim()) {
      setActiveSearch("");
      setSearchError(
        "Please enter a Request ID, teacher name, phone number, school, or subject."
      );
      return;
    }

    setActiveSearch(search.trim());
    setSearchError("");
  }

  function clearSearch() {
    setSearch("");
    setActiveSearch("");
    setSearchError("");
  }

  const filteredRequests = activeSearch
    ? requests.filter((request: any) => {
        const searchText = activeSearch.toLowerCase();

        return (
          request.request_id?.toLowerCase().includes(searchText) ||
          request.teacher_name?.toLowerCase().includes(searchText) ||
          request.school?.toLowerCase().includes(searchText) ||
          request.phone?.toLowerCase().includes(searchText) ||
          request.subject?.toLowerCase().includes(searchText)
        );
      })
    : requests;

  return (
    <main className="min-h-screen px-4 py-7 sm:px-10 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-4 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400 sm:mb-3">
              Completed Work
            </p>

            <h1 className="text-3xl font-bold text-yellow-500 sm:text-4xl">
              Delivered Archive
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-400 sm:text-base">
              View delivered papers and move requests back for correction when needed.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded bg-yellow-500 px-4 py-3 text-center font-semibold text-black hover:bg-yellow-400 sm:py-2"
          >
            Back to Admin
          </a>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-5">
            <p className="text-sm text-gray-400">Delivered</p>
            <p className="mt-2 text-2xl font-bold text-green-400 sm:text-3xl">
              {requests.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-5">
            <p className="text-sm text-gray-400">Paid</p>
            <p className="mt-2 text-2xl font-bold text-yellow-400 sm:text-3xl">
              {requests.filter((r) => r.payment_status === "Paid").length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-5">
            <p className="text-sm text-gray-400">Corrections</p>
            <p className="mt-2 text-2xl font-bold text-orange-400 sm:text-3xl">
              {requests.filter((r) => r.corrected_at).length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-5">
            <p className="text-sm text-gray-400">Archive</p>
            <p className="mt-2 text-2xl font-bold text-blue-400 sm:text-3xl">
              {requests.length}
            </p>
          </div>
        </div>

        <div className="mb-7 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:mb-8 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Search delivered work"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="w-full rounded border border-yellow-500/20 bg-black/60 p-3 text-white placeholder:text-gray-500 outline-none focus:border-yellow-500"
            />

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <button
                type="button"
                onClick={handleSearch}
                className="rounded bg-yellow-500 px-5 py-3 font-semibold text-black hover:bg-yellow-400"
              >
                Search
              </button>

              {(activeSearch || searchError) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded border border-zinc-700 px-5 py-3 font-semibold text-white hover:border-yellow-500"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {activeSearch && (
            <p className="mt-4 text-sm text-gray-400">
              Showing results for:{" "}
              <span className="text-yellow-400">{activeSearch}</span>
            </p>
          )}

          {searchError && (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 sm:p-5">
              <p className="font-bold text-red-400">⚠ Search Required</p>
              <p className="mt-2 text-sm text-gray-400">{searchError}</p>
            </div>
          )}
        </div>

        <div className="space-y-5 sm:space-y-6">
          {filteredRequests.map((request: any) => {
            const totalAmount = Number(request.total_amount || 0);
            const paidAmount = Number(
              request.paid_amount || request.total_amount || 0
            );
            const previousAmount = Math.max(paidAmount - totalAmount, 0);
            const correctionAmount = totalAmount;
            const hasCorrectionBreakdown =
              Boolean(request.corrected_at) && previousAmount > 0;

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

                      {request.corrected_at && (
                        <span className="w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
                          Corrected
                        </span>
                      )}
                    </div>

                    <p className="mt-2 break-all text-sm text-gray-400">
                      Request ID: {request.request_id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-black">
                      Delivered
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

                <div className="mb-5 grid grid-cols-2 gap-3 text-sm sm:mb-6 sm:gap-4 lg:grid-cols-3">
                  {[
                    ["School", request.school],
                    ["Phone", request.phone],
                    ["Class", request.class],
                    ["Subject", request.subject],
                    ["Session", request.session],
                    ["Exam", request.examination],
                    ["Pages", request.page_count || 0],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-yellow-500/10 bg-black/40 p-3"
                    >
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {label}
                      </p>

                      <p className="mt-1 wrap-break-word font-semibold text-white">
                        {value || "-"}
                      </p>
                    </div>
                  ))}

                  {hasCorrectionBreakdown ? (
                    <>
                      <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Total Paid
                        </p>
                        <p className="mt-1 font-semibold text-green-400">
                          ₹{paidAmount}
                        </p>
                      </div>

                      <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Previous
                        </p>
                        <p className="mt-1 font-semibold text-white">
                          ₹{previousAmount}
                        </p>
                      </div>

                      <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Correction
                        </p>
                        <p className="mt-1 font-semibold text-yellow-400">
                          ₹{correctionAmount}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Total Amount
                        </p>
                        <p className="mt-1 font-semibold text-yellow-400">
                          ₹{totalAmount}
                        </p>
                      </div>

                      <div className="rounded-xl border border-yellow-500/10 bg-black/40 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Paid Amount
                        </p>
                        <p className="mt-1 font-semibold text-green-400">
                          ₹{paidAmount}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {hasCorrectionBreakdown && (
                  <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 sm:mb-6 sm:p-4">
                    <p className="text-sm font-semibold leading-6 text-yellow-400">
                      Payment includes the previous version and corrected final version.
                    </p>
                  </div>
                )}

                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  {request.final_pdf_url && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/final-papers/${request.final_pdf_url}`}
                      target="_blank"
                      className="rounded bg-green-500 px-4 py-3 text-center font-semibold text-black hover:bg-green-400 sm:inline-block sm:py-2"
                    >
                      View Final PDF
                    </a>
                  )}

                  <button
                    onClick={async () => {
                      await supabase
                        .from("paper_requests")
                        .update({
                          status: "Submitted",
                          final_pdf_url: null,
                          preview_url: null,
                          correction_notes: "Teacher requested revision",
                          corrected_at: new Date().toISOString(),
                          started_at: null,
                          ready_at: null,
                          delivered_at: null,
                        })
                        .eq("id", request.id);

                      fetchDelivered();
                    }}
                    className="rounded bg-yellow-500 px-4 py-3 font-semibold text-black hover:bg-yellow-400 sm:py-2"
                  >
                    Move Back For Correction
                  </button>
                </div>
              </div>
            );
          })}

          {activeSearch && filteredRequests.length === 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center sm:p-8">
              <p className="text-xl font-bold text-red-400">
                ⚠ No delivered requests found
              </p>

              <p className="mt-3 text-sm leading-6 text-gray-400 sm:text-base">
                No archive record matched your search.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Try checking the spelling, phone number, subject, teacher name, or Request ID.
              </p>
            </div>
          )}

          {!activeSearch && requests.length === 0 && (
            <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 text-center sm:p-8">
              <p className="text-xl font-bold text-yellow-500">
                No delivered requests yet
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-400 sm:text-base">
                Delivered work will appear here after customers download their final PDF.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}