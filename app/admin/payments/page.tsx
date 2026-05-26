"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        paper_requests (
          request_id,
          teacher_name,
          phone,
          subject,
          class,
          payment_status
        )
      `
      )
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      console.log(error);
      alert("Failed to load payment history");
    } else {
      setPayments(data || []);
    }
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "-";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleSearch() {
    if (!search.trim()) {
      setActiveSearch("");
      setSearchError(
        "Please enter a Request ID, teacher name, phone, subject, order ID, or payment ID."
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

  const filteredPayments = activeSearch
    ? payments.filter((payment: any) => {
        const searchText = activeSearch.toLowerCase();
        const request = payment.paper_requests;

        return (
          payment.razorpay_order_id?.toLowerCase().includes(searchText) ||
          payment.razorpay_payment_id?.toLowerCase().includes(searchText) ||
          payment.status?.toLowerCase().includes(searchText) ||
          payment.payment_type?.toLowerCase().includes(searchText) ||
          request?.request_id?.toLowerCase().includes(searchText) ||
          request?.teacher_name?.toLowerCase().includes(searchText) ||
          request?.phone?.toLowerCase().includes(searchText) ||
          request?.subject?.toLowerCase().includes(searchText)
        );
      })
    : payments;

  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const createdPayments = payments.filter(
    (payment) => payment.status === "created"
  );

  const totalCollected = paidPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10 animate-fade-in">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-3 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400">
              Admin Payments
            </p>

            <h1 className="text-4xl font-bold text-yellow-500">
              Payment History
            </h1>

            <p className="mt-2 text-gray-400">
              Track Razorpay orders, successful payments, abandoned attempts, and extra payments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin"
              className="rounded border border-zinc-700 px-4 py-2 font-semibold text-white hover:border-yellow-500"
            >
              Back to Admin
            </a>

            <a
              href="/archive"
              className="rounded bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
            >
              Archive
            </a>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Total Collected</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              ₹{totalCollected}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Paid Payments</p>
            <p className="mt-2 text-3xl font-bold text-green-400">
              {paidPayments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Open Attempts</p>
            <p className="mt-2 text-3xl font-bold text-orange-400">
              {createdPayments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Total Records</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {payments.length}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Search payments"
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

          {activeSearch && (
            <p className="mt-4 text-sm text-gray-400">
              Showing results for:{" "}
              <span className="text-yellow-400">{activeSearch}</span>
            </p>
          )}

          {searchError && (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <p className="font-bold text-red-400">Search Required</p>
              <p className="mt-2 text-sm text-gray-400">{searchError}</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-8 text-center">
            <p className="text-yellow-400">Loading payment history...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-5">
            {filteredPayments.map((payment: any) => {
              const request = payment.paper_requests;

              return (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 shadow-lg"
                >
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold">
                          ₹{payment.amount || 0}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            payment.status === "paid"
                              ? "bg-green-500 text-black"
                              : payment.status === "created"
                              ? "bg-orange-500 text-black"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {payment.status}
                        </span>

                        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-400">
                          {payment.payment_type || "initial"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-400">
                        {request?.teacher_name || "Unknown teacher"} ·{" "}
                        {request?.request_id || "No request ID"}
                      </p>
                    </div>

                    <div className="text-left text-sm text-gray-400 sm:text-right">
                      <p>Created: {formatDate(payment.created_at)}</p>
                      <p>Paid: {formatDate(payment.paid_at)}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <p>
                      <b>Order ID:</b>{" "}
                      <span className="break-all text-gray-300">
                        {payment.razorpay_order_id || "-"}
                      </span>
                    </p>

                    <p>
                      <b>Payment ID:</b>{" "}
                      <span className="break-all text-gray-300">
                        {payment.razorpay_payment_id || "-"}
                      </span>
                    </p>

                    <p>
                      <b>Request Payment:</b>{" "}
                      {request?.payment_status || "-"}
                    </p>

                    <p>
                      <b>Phone:</b> {request?.phone || "-"}
                    </p>

                    <p>
                      <b>Subject:</b> {request?.subject || "-"}
                    </p>

                    <p>
                      <b>Class:</b> {request?.class || "-"}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredPayments.length === 0 && (
              <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-8 text-center">
                <p className="text-xl font-bold text-yellow-500">
                  No payment records found
                </p>

                <p className="mt-2 text-gray-400">
                  Payment attempts will appear here after customers open Razorpay checkout.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}