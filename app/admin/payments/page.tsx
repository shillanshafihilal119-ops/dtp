"use client";

import { useEffect, useState } from "react";

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

    try {
      const res = await fetch("/api/admin-payments", {
        headers: {
          "x-admin-password": process.env.NEXT_PUBLIC_ADMIN_PASSWORD!,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Failed to load payment history");
        setPayments([]);
        return;
      }

      setPayments(result.payments || []);
    } catch (error) {
      console.log(error);
      alert("Failed to load payment history");
      setPayments([]);
    } finally {
      setLoading(false);
    }
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

  const requestPaymentRows = Object.values(
    filteredPayments.reduce((acc: any, payment: any) => {
      const requestKey =
        payment.request_id || payment.paper_requests?.request_id || payment.id;

      if (!acc[requestKey]) {
        acc[requestKey] = {
          request: payment.paper_requests,
          created_at: payment.created_at,
          paid_at: payment.paid_at,
          orderIds: [],
          paymentIds: [],
          firstAmount: 0,
          correctionAmount: 0,
          totalAmount: 0,
        };
      }

      acc[requestKey].created_at =
        payment.created_at < acc[requestKey].created_at
          ? payment.created_at
          : acc[requestKey].created_at;

      acc[requestKey].paid_at =
        payment.paid_at && payment.paid_at > (acc[requestKey].paid_at || "")
          ? payment.paid_at
          : acc[requestKey].paid_at;

      if (payment.razorpay_order_id) {
        acc[requestKey].orderIds.push(payment.razorpay_order_id);
      }

      if (payment.razorpay_payment_id) {
        acc[requestKey].paymentIds.push(payment.razorpay_payment_id);
      }

      if (payment.status === "paid") {
        const amount = Number(payment.amount || 0);

        if (payment.payment_type === "extra") {
          acc[requestKey].correctionAmount += amount;
        } else {
          acc[requestKey].firstAmount += amount;
        }

        acc[requestKey].totalAmount += amount;
      }

      return acc;
    }, {})
  );

  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const createdPayments = payments.filter(
    (payment) => payment.status === "created"
  );

  const totalCollected = paidPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  return (
    <main className="min-h-screen px-4 py-7 sm:px-10 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-4 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400 sm:mb-3">
              Admin Payments
            </p>

            <h1 className="text-3xl font-bold text-yellow-500 sm:text-4xl">
              Payment History
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-400 sm:text-base">
              Track Razorpay orders, successful payments, abandoned attempts,
              and extra payments.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <a
              href="/admin"
              className="rounded border border-zinc-700 px-4 py-3 text-center font-semibold text-white hover:border-yellow-500 sm:py-2"
            >
              Back
            </a>

            <a
              href="/archive"
              className="rounded bg-yellow-500 px-4 py-3 text-center font-semibold text-black hover:bg-yellow-400 sm:py-2"
            >
              Archive
            </a>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-5">
            <p className="text-sm text-gray-400">Collected</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400 sm:text-3xl">
              ₹{totalCollected}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-5">
            <p className="text-sm text-gray-400">Paid</p>
            <p className="mt-2 text-2xl font-bold text-green-400 sm:text-3xl">
              {paidPayments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-5">
            <p className="text-sm text-gray-400">Open</p>
            <p className="mt-2 text-2xl font-bold text-orange-400 sm:text-3xl">
              {createdPayments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:p-5">
            <p className="text-sm text-gray-400">Records</p>
            <p className="mt-2 text-2xl font-bold text-blue-400 sm:text-3xl">
              {payments.length}
            </p>
          </div>
        </div>

        <div className="mb-7 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 sm:mb-8 sm:p-6">
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
          <div className="overflow-hidden rounded-2xl border border-yellow-500/20 bg-zinc-950 shadow-lg">
            <div className="overflow-x-auto">
              <div className="min-w-220">
                <div className="grid grid-cols-[0.9fr_1.15fr_1.3fr_1.2fr_0.75fr_0.8fr_0.85fr] items-center gap-4 bg-black/50 px-5 py-3 text-xs font-bold uppercase text-gray-500">
                  <p>Date</p>
                  <p>Customer</p>
                  <p>Request</p>
                  <p>Payment</p>
                  <p className="text-right">First</p>
                  <p className="text-right">Extra</p>
                  <p className="text-right">Total</p>
                </div>

                <div>
                  {requestPaymentRows.map((row: any, index: number) => {
                    const orderId = row.orderIds[0] || "-";
                    const paymentId = row.paymentIds[0] || "-";
                    const shortOrderId =
                      orderId !== "-" ? `${orderId.slice(0, 12)}...` : "-";
                    const shortPaymentId =
                      paymentId !== "-" ? `${paymentId.slice(0, 10)}...` : "-";
                    const dateValue = row.paid_at || row.created_at;
                    const dateText = new Date(dateValue).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    );
                    const timeText = new Date(dateValue).toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );

                    return (
                      <div
                        key={`${row.request?.request_id || "payment"}-${index}`}
                        className="grid grid-cols-[0.9fr_1.15fr_1.3fr_1.2fr_0.75fr_0.8fr_0.85fr] items-center gap-4 px-5 py-4 text-sm transition hover:bg-yellow-500/5"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {dateText}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {timeText}
                          </p>
                        </div>

                        <div>
                          <p className="truncate font-semibold text-white">
                            {row.request?.teacher_name || "Unknown"}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {row.request?.phone || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="truncate font-semibold text-white">
                            {row.request?.request_id || "-"}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {row.request?.subject || "-"} ·{" "}
                            {row.request?.class || "-"}
                          </p>
                        </div>

                        <div>
                          <p
                            className="truncate text-xs text-gray-300"
                            title={orderId}
                          >
                            O: {shortOrderId}
                          </p>

                          <p
                            className="mt-1 truncate text-xs text-gray-500"
                            title={paymentId}
                          >
                            P: {shortPaymentId}
                          </p>
                        </div>

                        <p className="text-right font-bold text-white">
                          ₹{row.firstAmount}
                        </p>

                        <p
                          className={`text-right font-bold ${
                            row.correctionAmount > 0
                              ? "text-orange-400"
                              : "text-gray-600"
                          }`}
                        >
                          {row.correctionAmount > 0
                            ? `₹${row.correctionAmount}`
                            : "-"}
                        </p>

                        <p className="text-right text-lg font-bold text-emerald-400">
                          ₹{row.totalAmount}
                        </p>
                      </div>
                    );
                  })}

                  {requestPaymentRows.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-xl font-bold text-yellow-500">
                        No payment records found
                      </p>

                      <p className="mt-2 text-gray-400">
                        Payment attempts will appear here after customers open
                        Razorpay checkout.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}