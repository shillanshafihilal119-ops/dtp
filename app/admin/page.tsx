"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";



export default function AdminPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
  const isAdmin =
    localStorage.getItem("isAdmin");
  
  const loginTime =
  localStorage.getItem("adminLoginTime");

  const expired =
    !loginTime ||
    Date.now() - Number(loginTime) >
    24 * 60 * 60 * 1000;

  if (isAdmin !== "true" || expired) {
    router.push("/admin-login");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminLoginTime");
    return;
  }

  fetchRequests();
}, [router]);

  async function updateStatus(
  id: number,
  status: string
) {
  setLoading(true);
  const { error } = await supabase
    .from("paper_requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    setLoading(false);
    console.log("SUPABASE ERROR:", error);

    alert(
      "Failed to update status"
    );
  } else {
    setLoading(false);
    fetchRequests();
  }
}

async function uploadPreview(
  id: number,
  file: File
) {
  setLoading(true);
  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } =
    await supabase.storage
      .from("paper-previews")
      .upload(fileName, file);

  if (error) {
    console.log(error);
    alert("Preview upload failed");
    return;
  }

  const { error: updateError } =
    await supabase
      .from("paper_requests")
      .update({
        preview_url: data.path,
      })
      .eq("id", id);

  if (updateError) {
    console.log(updateError);
    alert("Failed to save preview");
    setLoading(false);

  } else {
    alert("Preview uploaded");
    setLoading(false);
    fetchRequests();
  }
}

    async function uploadFinalPdf(
  id: number,
  file: File
) {
  setLoading(true);
  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } =
    await supabase.storage
      .from("final-papers")
      .upload(fileName, file);

  if (error) {
    console.log(error);

    alert("PDF upload failed");
    setLoading(false);
    return;
  }

  const { error: updateError } =
    await supabase
      .from("paper_requests")
      .update({
        final_pdf_url: data.path,
        status: "Ready",
      })
      .eq("id", id);

  if (updateError) {
    console.log(updateError);

    alert(
      "Failed to save PDF"
    );

    setLoading(false);

  } else {
    alert("PDF uploaded");
    setLoading(false);
    fetchRequests();
  }
}

  async function updatePaymentStatus(
  id: number,
  payment_status: string
) {
  setLoading(true);
  const { error } =
    await supabase
      .from("paper_requests")
      .update({
        payment_status,
      })
      .eq("id", id);

  if (error) {
    setLoading(false);
    console.log(error);

    alert(
      "Failed to update payment"
    );
  } else {
    setLoading(false);
    fetchRequests();
  }
}

  async function deleteRequest(id: number) {
  const confirmed = confirm(
    "Are you sure you want to delete this request?"
  );

  if (!confirmed) return;
  
  setLoading(true);
  
  const { error } = await supabase
    .from("paper_requests")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Failed to delete request");
    console.log(error);
    setLoading(false);

  } else {
    alert("Request deleted");

    setLoading(false);
    
    fetchRequests();
  }
}
  async function fetchRequests() {
    const { data, error } = await supabase
      .from("paper_requests")
      .select("*")
      .neq("status", "Delivered")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
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
        Working...
      </p>
    </div>
  </div>
)}
      <div className="flex justify-between items-center mb-8">
  <h1 className="text-3xl text-yellow-500 font-bold">
    Admin Dashboard
  </h1>

  <div className="flex gap-3">
    <a
      href="/archive"
      className="bg-yellow-500 text-black px-4 py-2 rounded"
    >
      Archive
    </a>

    <button
      onClick={() => {
        localStorage.removeItem(
          "isAdmin"
        );

        router.push(
          "/admin-login"
        );
      }}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Logout
    </button>
  </div>
</div>

      <input
  type="text"
  placeholder="Search by teacher, phone, class, or subject"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="border p-3 rounded w-full max-w-md mb-4"
/>

<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
    className="border p-3 rounded mb-4 block w-full max-w-xs bg-grey text-white focus:bg-yellow-500 focus:text-black"
>
  <option value="All">All Statuses</option>
  <option value="Submitted">Submitted</option>
  <option value="In Progress">In Progress</option>
  <option value="Ready">Ready</option>
  <option value="Delivered">Delivered</option>
</select>

<select
  value={paymentFilter}
  onChange={(e) =>
    setPaymentFilter(
      e.target.value
    )
  }
   className="border p-3 rounded mb-4 block w-full max-w-xs bg-grey text-white focus:bg-yellow-500 focus:text-black"
>
  <option value="All">
    All Payments
  </option>

  <option value="Unpaid">
    Unpaid
  </option>

  <option value="Paid">
    Paid
  </option>
</select>

      <div className="space-y-6">
        {requests
  .filter((request: any) => {
  const searchText =
    search.toLowerCase();

  const matchesSearch =
    request.teacher_name
      ?.toLowerCase()
      .includes(searchText) ||

    request.phone
      ?.toLowerCase()
      .includes(searchText) ||

    request.class
      ?.toLowerCase()
      .includes(searchText) ||

    request.subject
      ?.toLowerCase()
      .includes(searchText) ||

    request.school
      ?.toLowerCase()
      .includes(searchText)

  const matchesStatus =
    statusFilter === "All" ||
    request.status ===
      statusFilter;

      const matchesPayment =
  paymentFilter === "All" ||
  request.payment_status ===
    paymentFilter;
    
  return (
    matchesSearch &&
    matchesStatus &&
    matchesPayment
  );
})


  .map((request) => (
          <div
            key={request.id}
            className={`border p-3 rounded w-full text-white mb-6 block ${
            request.correction_notes && (
            <div className="mb-4">
            <p className="text-yellow-400 font-semibold">
            Correction Request
            </p>

            <p className="text-sm text-gray-300 mt-1">
            {request.correction_notes}
            </p>
        </div>
        )}
        
          }`}
          >
            <h3 className="text-2xl font-bold mb-6">
              {request.teacher_name}
              {request.correction_notes && (
              <div className="mb-4">
              <p className="text-yellow-400 font-semibold">
              Correction Request
              </p>

              <p className="text-sm text-gray-300 mt-1">
              {request.correction_notes}
              </p>
            </div>
            )}
            </h3>
            
            <p className="mb-3 text-sm">
            <b>Request ID:</b> {request.request_id}
            </p>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
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
</div>

<p className="mb-4">
  <b>Instructions:</b> {request.instructions}
</p>

            <div className="mt-3 mb-6 block">
            <p className="mb-2">
            Status: {request.status}
            </p>

            {request.final_pdf_url && (
             <a
            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/final-papers/${request.final_pdf_url}`}
            target="_blank"
            className="text-blue-500 underline block mt-6"
            >
            Download Final PDF
            </a>
            )}

            <select
            value={request.status}
            onChange={(e) =>
            updateStatus(
            request.id,
            e.target.value
            )
        }
             className="border p-3 rounded mb-4 block w-full max-w-xs bg-grey text-white focus:bg-yellow-500 focus:text-black">
            
            <option>
            Submitted
            </option>

            <option>
            In Progress
            </option>

            <option>
            Ready
            </option>

            <option>
            Delivered
            </option>
            </select>
            </div>

            <div className="mt-3">
  <p className="mb-2">
    Payment: {request.payment_status}
  </p>

  <select
    value={
      request.payment_status ||
      "Unpaid"
    }
    onChange={(e) =>
      updatePaymentStatus(
        request.id,
        e.target.value
      )
    }
     className="border p-3 rounded mb-4 block w-full max-w-xs bg-grey text-white focus:bg-yellow-500 focus:text-black">
  
    <option value="Unpaid">
      Unpaid
    </option>

    <option value="Paid">
      Paid
    </option>
  </select>
</div>
            
            <button
            onClick={() =>
            deleteRequest(request.id)
            }
            className="bg-red-500 text-white p-3 rounded w-full disabled:opacity-50"
            >
            Delete
            </button>

            {!request.final_pdf_url ? (
            <div className="mt-4">
            <p className="mb-2 font-semibold">
            Upload Final PDF for Download
            </p>

            <input
            className="border p-3 rounded"
            type="file"
            accept=".pdf"
            onChange={(e) => {
            if (e.target.files?.[0]) {
              uploadFinalPdf(
            request.id,
            e.target.files[0]
          );
        }
      }}
    />
  </div>
) : (
  <p className="mt-4 text-green-500 font-semibold">
    Final PDF already uploaded
  </p>
)}

<div className="mt-4">
  <p className="mb-2 font-semibold">
    Upload Preview Image
  </p>

  <input
  className="border p-3 rounded mb-6"
    type="file"
    accept="image/*"
    onChange={(e) => {
      if (e.target.files?.[0]) {
        uploadPreview(
          request.id,
          e.target.files[0]
        );
      }
    }}
  />
</div>

            {request.file_url && (
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/paper-uploads/${request.file_url}`}
                alt="Uploaded paper"
                className="mt-4 rounded border w-full max-w-md"
              />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}