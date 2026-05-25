"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function ArchivePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchError, setSearchError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");

    if (isAdmin !== "true") {
      alert("Please login first.");
      router.push("/admin-login");
      return;
    }

    fetchDelivered();
  }, [router]);

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
      setSearchError("Please enter a Request ID, teacher name, phone number, school, or subject.");
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

  const monthlyRevenue = Object.values(
    requests.reduce((acc: any, request: any) => {
      const month = new Date(request.created_at).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!acc[month]) {
        acc[month] = {
          month,
          revenue: 0,
        };
      }

      if (request.payment_status === "Paid") {
        acc[month].revenue += 49;
      }

      return acc;
    }, {})
  );

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10 animate-fade-in">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-3 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400">
              Completed Work
            </p>

            <h1 className="text-4xl font-bold text-yellow-500">
              Delivered Archive
            </h1>

            <p className="mt-2 text-gray-400">
              View delivered papers and move requests back for correction when needed.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
          >
            Back to Admin
          </a>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Delivered</p>
            <p className="mt-2 text-3xl font-bold text-green-400">
              {requests.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Paid</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {requests.filter((r) => r.payment_status === "Paid").length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Corrections</p>
            <p className="mt-2 text-3xl font-bold text-orange-400">
              {requests.filter((r) => r.correction_notes).length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Revenue</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              ₹{requests.filter((r) => r.payment_status === "Paid").length * 49}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
            <p className="text-sm text-gray-400">Total Archive</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {requests.length}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6">
          <h3 className="mb-6 text-2xl font-bold text-yellow-500">
            Monthly Revenue
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6">
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
              className="w-full rounded border p-3"
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
              <p className="font-bold text-red-400">⚠ Search Required</p>
              <p className="mt-2 text-sm text-gray-400">{searchError}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {filteredRequests.map((request: any) => (
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
                  <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-black">
                    Delivered
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

              <div className="mb-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <p><b>School:</b> {request.school}</p>
                <p><b>Phone:</b> {request.phone}</p>
                <p><b>Class:</b> {request.class}</p>
                <p><b>Subject:</b> {request.subject}</p>
                <p><b>Session:</b> {request.session}</p>
                <p><b>Exam:</b> {request.examination}</p>
              </div>

              {request.final_pdf_url && (
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/final-papers/${request.final_pdf_url}`}
                  target="_blank"
                  className="inline-block rounded bg-green-500 px-4 py-2 font-semibold text-black hover:bg-green-400"
                >
                  View Final PDF
                </a>
              )}

              <button
                onClick={async () => {
                  await supabase
                    .from("paper_requests")
                    .update({
                      status: "In Progress",
                      final_pdf_url: null,
                      payment_status: "Unpaid",
                      correction_notes: "Teacher requested revision",
                    })
                    .eq("id", request.id);

                  fetchDelivered();
                }}
                className="mt-4 block rounded bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
              >
                Move Back For Correction
              </button>
            </div>
          ))}

          {activeSearch && filteredRequests.length === 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <p className="text-xl font-bold text-red-400">
                ⚠ No delivered requests found
              </p>

              <p className="mt-3 text-gray-400">
                No archive record matched your search.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Try checking the spelling, phone number, subject, teacher name, or Request ID.
              </p>
            </div>
          )}

          {!activeSearch && requests.length === 0 && (
            <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-8 text-center">
              <p className="text-xl font-bold text-yellow-500">
                No delivered requests yet
              </p>

              <p className="mt-2 text-gray-400">
                Delivered work will appear here after customers download their final PDF.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}