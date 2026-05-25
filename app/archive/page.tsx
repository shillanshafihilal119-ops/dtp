"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ArchivePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const deliveredCount = requests.length;
  const [search, setSearch] = useState("");
  const router = useRouter();

useEffect(() => {
  const isAdmin =
    localStorage.getItem("isAdmin");

  if (isAdmin !== "true") {
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

  return (
    <main className="min-h-screen p-4 sm:p-10">
      
      <div className="flex justify-between items-center mb-8">
  <div>
  <h1 className="text-3xl font-bold text-yellow-500">
    Delivered Archive
  </h1>

  <p className="text-gray-400 mt-2">
    Total Delivered: 
    {deliveredCount}
  </p>
</div>

  <a
    href="/admin"
    className="bg-yellow-500 text-black px-4 py-2 rounded"
  >
    Back to Admin
  </a>
</div>

      <div className="flex gap-3 mb-6">
  <input
    type="text"
    placeholder="Search delivered work"
    value={search}
    onChange={(e) =>
      setSearch(e.target.value)
    }
    className="border p-3 rounded w-full max-w-md"
  />

  <button
    className="bg-yellow-500 text-black px-4 py-2 rounded"
  >
    Search
  </button>
</div>
      

      <div className="space-y-6">
        {requests
          .filter((request: any) => {
            const searchText = search.toLowerCase();

            return (
              request.request_id
                ?.toLowerCase()
                .includes(searchText) ||
              request.teacher_name
                ?.toLowerCase()
                .includes(searchText) ||
              request.school
                ?.toLowerCase()
                .includes(searchText) ||
              request.phone
                ?.toLowerCase()
                .includes(searchText) ||
              request.subject
                ?.toLowerCase()
                .includes(searchText)
            );
          })
          .map((request: any) => (
            <div
              key={request.id}
              className="border p-3 rounded w-full text-white mb-6 block"
            >
              
              <h2 className="text-xl font-bold mb-6">
                {request.teacher_name}
              </h2>

              <p>
                <b>Request ID:</b> {request.request_id}
              </p>

              <p>
                <b>School:</b> {request.school}
              </p>

              <p>
                <b>Phone:</b> {request.phone}
              </p>

              <p>
                <b>Subject:</b> {request.subject}
              </p>

              <button
  onClick={async () => {
    await supabase
  .from("paper_requests")
  .update({
    status: "In Progress",
    final_pdf_url: null,
    payment_status: "Unpaid",
    correction_notes:
      "Teacher requested revision",
  })
  .eq("id", request.id);

    fetchDelivered();
  }}
  className="bg-yellow-500 text-black px-4 py-2 rounded mt-3"
>
  Move Back For Correction
</button>

              {request.final_pdf_url && (
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/final-papers/${request.final_pdf_url}`}
                  target="_blank"
                  className="text-blue-500 underline block mt-3"
                >
                  View Final PDF
                </a>
              )}
            </div>
          ))}
      </div>

      {requests.length === 0 && (
  <p className="text-gray-400 mt-6">
    No delivered requests yet.
  </p>
)}

    </main>
  );
}