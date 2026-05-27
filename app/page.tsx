"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [teacherName, setTeacherName] = useState("");
  const [school, setSchool] = useState("");
  const [phone, setPhone] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [subject, setSubject] = useState("");
  const [session, setSession] = useState("");
  const [examination, setExamination] = useState("");
  const [marks, setMarks] = useState("");
  const [duration, setDuration] = useState("");
  const [medium, setMedium] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [copiedRequestId, setCopiedRequestId] = useState(false);
  const [copiedTrackLink, setCopiedTrackLink] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<any[]>([]);
  const [estimateMedium, setEstimateMedium] = useState("Urdu");
  const [estimatePages, setEstimatePages] = useState(1);

  const submittedBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  async function fetchPricing() {
    const { data, error } = await supabase
      .from("pricing_settings")
      .select("*")
      .order("medium", { ascending: true });

    if (error) {
      console.log(error);
      setPrices([
        { medium: "Urdu", rate_per_page: 25 },
        { medium: "Kashmiri", rate_per_page: 35 },
        { medium: "English", rate_per_page: 20 },
      ]);
    } else {
      setPrices(data || []);
    }
  }

  function getRateByMedium(selectedMedium: string) {
    const price = prices.find((item) => item.medium === selectedMedium);
    return Number(price?.rate_per_page || 0);
  }

  const estimatedRate = getRateByMedium(estimateMedium);
  const estimatedTotal = Math.max(1, estimatePages || 1) * estimatedRate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameRegex = /^[A-Za-z\u0600-\u06FF\s]+$/;
    const phoneRegex = /^[0-9]{10,12}$/;
    const marksRegex = /^[0-9]+$/;

    if (
      !teacherName ||
      !school ||
      !phone ||
      !studentClass ||
      !subject ||
      !session ||
      !examination ||
      !marks ||
      !duration ||
      !medium ||
      !file
    ) {
      alert("Please fill all required fields and upload the paper image.");
      return;
    }

    if (!nameRegex.test(teacherName)) {
      alert("Teacher name should contain letters only.");
      return;
    }

    if (!phoneRegex.test(phone)) {
      alert("Phone number must contain only digits and must be 10 to 12 digits long.");
      return;
    }

    if (!marksRegex.test(marks)) {
      alert("Total marks should contain numbers only.");
      return;
    }

    setLoading(true);

    const requestId = "REQ-" + Date.now();
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error: uploadError } = await supabase.storage
      .from("paper-uploads")
      .upload(fileName, file);

    if (uploadError) {
      alert("File upload failed");
      console.log(uploadError);
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("paper_requests").insert([
      {
        status: "Submitted",
        payment_status: "Unpaid",
        request_id: requestId,
        teacher_name: teacherName,
        school,
        phone,
        class: studentClass,
        subject,
        session,
        examination,
        marks,
        duration,
        medium,
        instructions,
        file_url: data.path,
      },
    ]);

    if (error) {
      alert("Error saving request");
      console.log(error);
      setLoading(false);
      return;
    }

    setSubmittedId(requestId);
    setLoading(false);

    setTimeout(() => {
      submittedBoxRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);

    setTeacherName("");
    setSchool("");
    setPhone("");
    setStudentClass("");
    setSubject("");
    setSession("");
    setExamination("");
    setMarks("");
    setDuration("");
    setMedium("");
    setInstructions("");
    setFile(null);
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-10 sm:py-12">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-lg border border-yellow-500 bg-black p-6">
            <p className="text-lg text-yellow-400">Processing Request...</p>
          </div>
        </div>
      )}

      <section className="mx-auto mb-12 max-w-6xl sm:mb-16">
        <p className="mb-4 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400">
          Trusted by Teachers • 1 Day Delivery
        </p>

        <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-6xl">
          Professional
          <span className="text-yellow-500"> Urdu & Kashmiri </span>
          Question Paper Formatting
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:mt-6 sm:text-lg">
          Upload handwritten question papers and receive clean, printable PDFs
          with accurate formatting, proper layout, and fast delivery.
        </p>

        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
          <a
            href="#request-form"
            className="rounded bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400"
          >
            Submit Request
          </a>

          <a
            href="/track"
            className="rounded border border-yellow-500 px-5 py-3 text-yellow-400 transition hover:bg-yellow-500 hover:text-black"
          >
            Track Your Paper
          </a>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded border border-yellow-500/20 bg-zinc-900 p-4">
            <p className="font-bold text-yellow-400">⚡ 1 Day Delivery</p>
            <p className="mt-2 text-sm text-gray-400">
              Fast turnaround for urgent school and coaching papers.
            </p>
          </div>

          <div className="rounded border border-yellow-500/20 bg-zinc-900 p-4">
            <p className="font-bold text-yellow-400">📄 Clean PDF Output</p>
            <p className="mt-2 text-sm text-gray-400">
              Proper formatting, spacing, headings, and printable layout.
            </p>
          </div>

          <div className="rounded border border-yellow-500/20 bg-zinc-900 p-4">
            <p className="font-bold text-yellow-400">✓ Correction Support</p>
            <p className="mt-2 text-sm text-gray-400">
              Request corrections after delivery when needed.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-yellow-500">
            Submit Your Paper Request
          </h2>
          <p className="mt-2 text-gray-400">
            Fill in the paper details and upload your handwritten paper image.
          </p>
        </div>

        <div className="mb-10 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 shadow-lg">
          <div className="mb-6">
            <p className="text-2xl font-bold text-yellow-500">Pricing</p>
            <p className="mt-2 text-gray-400">
              Rates are charged per final PDF page. The final amount is
              calculated after your formatted PDF is uploaded by admin.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {prices.map((price) => (
              <div
                key={price.medium}
                className="rounded-xl border border-yellow-500/10 bg-black/40 p-4"
              >
                <p className="font-semibold text-yellow-400">
                  {price.medium}
                </p>

                <p className="mt-3 text-3xl font-bold">
                  ₹{price.rate_per_page}
                </p>

                <p className="text-sm text-gray-400">per page</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-yellow-500/10 bg-black/40 p-5">
            <p className="mb-4 text-lg font-bold text-yellow-500">
              Price Estimator
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={estimateMedium}
                onChange={(e) => setEstimateMedium(e.target.value)}
                className="rounded border border-yellow-500/20 bg-black p-3 text-white outline-none focus:border-yellow-500"
              >
                {prices.map((price) => (
                  <option key={price.medium} value={price.medium}>
                    {price.medium}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={1}
                value={estimatePages}
                onChange={(e) =>
                  setEstimatePages(Math.max(1, Number(e.target.value) || 1))
                }
                placeholder="Estimated pages"
                className="rounded border border-yellow-500/20 bg-black p-3 text-white outline-none focus:border-yellow-500"
              />
            </div>

            <div className="mt-5 rounded-xl border border-yellow-500/20 bg-zinc-950 p-5 text-center">
              <p className="text-sm text-gray-400">Estimated Cost</p>

              <p className="mt-2 text-4xl font-bold text-yellow-500">
                ₹{estimatedTotal}
              </p>

              <p className="mt-3 text-xs text-gray-500">
                This is only an estimate. Final amount depends on final PDF page count.
              </p>
            </div>
          </div>
        </div>

        <form
          id="request-form"
          onSubmit={handleSubmit}
          className="grid w-full gap-4 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 shadow-lg sm:grid-cols-2 sm:p-8"
        >
          <input required type="text" placeholder="Teacher Name" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="rounded border p-3" />
          <input required type="text" placeholder="School Name" value={school} onChange={(e) => setSchool(e.target.value)} className="rounded border p-3" />
          <input required type="tel" placeholder="Phone Number" value={phone} maxLength={12} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="rounded border p-3" />
          <input required type="text" placeholder="Class" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} className="rounded border p-3" />
          <input required type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded border p-3" />
          <input required type="text" placeholder="Session" value={session} onChange={(e) => setSession(e.target.value)} className="rounded border p-3" />
          <input required type="text" placeholder="Examination" value={examination} onChange={(e) => setExamination(e.target.value)} className="rounded border p-3" />
          <input required type="text" placeholder="Total Marks" value={marks} onChange={(e) => setMarks(e.target.value.replace(/\D/g, ""))} className="rounded border p-3" />
          <input required type="text" placeholder="Duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="rounded border p-3" />

          <select
            required
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            className="rounded border bg-grey p-3 text-white focus:bg-yellow-500 focus:text-black"
          >
            <option value="">Select Medium</option>
            {prices.map((price) => (
              <option key={price.medium} value={price.medium}>
                {price.medium}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Additional Instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="rounded border p-3 sm:col-span-2"
          />

          <input
            required
            type="file"
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0]);
            }}
            className="w-full rounded border p-3 sm:col-span-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-yellow-500 p-4 font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50 sm:col-span-2"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>

          {submittedId && (
            <div
              ref={submittedBoxRef}
              className="rounded-2xl border border-green-500/30 bg-black/60 p-5 text-white sm:col-span-2"
            >
              <p className="text-xl font-bold text-green-400">
                ✓ Request Submitted Successfully
              </p>

              <p className="mt-3 text-sm text-gray-300">
                Your paper request has been received. Please keep your Request ID safe.
              </p>

              <div className="mt-5 rounded-xl border border-yellow-500/20 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Request ID
                </p>

                <p className="mt-2 break-all text-2xl font-bold text-yellow-500">
                  {submittedId}
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-yellow-500/20 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Pricing Reminder
                </p>

                <p className="mt-2 text-sm text-gray-300">
                  Final amount depends on the final PDF page count.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {prices.map((price) => (
                    <div
                      key={price.medium}
                      className="rounded-xl border border-yellow-500/10 bg-black/40 p-3"
                    >
                      <p className="font-semibold text-yellow-400">
                        {price.medium}
                      </p>

                      <p className="mt-1 text-lg font-bold text-white">
                        ₹{price.rate_per_page}
                      </p>

                      <p className="text-xs text-gray-500">per page</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(submittedId);
                    setCopiedRequestId(true);
                    setTimeout(() => setCopiedRequestId(false), 1500);
                  }}
                  className="rounded bg-yellow-500 px-4 py-3 font-semibold text-black hover:bg-yellow-400"
                >
                  {copiedRequestId ? "Copied!" : "Copy ID"}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `https://dtp-gules.vercel.app/track`
                    );
                    setCopiedTrackLink(true);
                    setTimeout(() => setCopiedTrackLink(false), 1500);
                  }}
                  className="rounded bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500"
                >
                  {copiedTrackLink ? "Copied!" : "Copy Track Link"}
                </button>

                <a
                  href="/track"
                  className="rounded bg-green-600 px-4 py-3 text-center font-semibold text-white hover:bg-green-500"
                >
                  Track Request
                </a>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Use the Request ID or tracking link to check paper progress anytime.
              </p>
            </div>
          )}
        </form>
      </section>

      <section className="mx-auto mt-20 max-w-6xl">
        <h2 className="mb-10 text-center text-3xl font-bold text-yellow-500">
          How It Works
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["📝", "Upload Paper", "Submit handwritten question paper details and images."],
            ["⚙️", "Formatting", "We professionally format Urdu, Kashmiri and English papers."],
            ["👀", "Preview", "Preview image appears before final delivery."],
            ["📄", "Final PDF", "Download the final printable PDF after completion."],
          ].map(([icon, title, text]) => (
            <div
              key={title}
              className="rounded-xl border border-yellow-500/20 bg-zinc-900 p-6 transition hover:-translate-y-1 hover:border-yellow-500"
            >
              <div className="mb-4 text-3xl">{icon}</div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm text-gray-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl">
        <h2 className="mb-10 text-center text-3xl font-bold text-yellow-500">
          Why Choose Vintage DTP
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-yellow-500/20 bg-zinc-900 p-6">
            <h3 className="font-bold text-yellow-400">Professional Formatting</h3>
            <p className="mt-3 text-gray-400">
              Clean Urdu, Kashmiri and English layouts with proper spacing and structure.
            </p>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-zinc-900 p-6">
            <h3 className="font-bold text-yellow-400">Correction Support</h3>
            <p className="mt-3 text-gray-400">
              Request revisions after delivery when corrections are needed.
            </p>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-zinc-900 p-6">
            <h3 className="font-bold text-yellow-400">Fast Delivery</h3>
            <p className="mt-3 text-gray-400">
              Most work is completed within 1 day after submission.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl">
        <h2 className="mb-10 text-center text-3xl font-bold text-yellow-500">
          Trusted Service
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-yellow-500/20 bg-zinc-900 p-8 text-center">
            <p className="text-4xl font-bold text-yellow-400">100+</p>
            <p className="mt-3 text-gray-400">Papers Formatted</p>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-zinc-900 p-8 text-center">
            <p className="text-4xl font-bold text-yellow-400">1 Day</p>
            <p className="mt-3 text-gray-400">Average Delivery</p>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-zinc-900 p-8 text-center">
            <p className="text-4xl font-bold text-yellow-400">Urdu</p>
            <p className="mt-3 text-gray-400">Kashmiri • English</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 mb-20 max-w-6xl">
        <h2 className="mb-10 text-center text-3xl font-bold text-yellow-500">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <div className="rounded-xl border border-yellow-500/20 bg-zinc-900 p-6">
            <h3 className="font-bold">How long does delivery take?</h3>
            <p className="mt-3 text-gray-400">
              Most papers are completed within 1 day.
            </p>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-zinc-900 p-6">
            <h3 className="font-bold">Can I request corrections?</h3>
            <p className="mt-3 text-gray-400">
              Yes. Corrections can be requested after delivery.
            </p>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-zinc-900 p-6">
            <h3 className="font-bold">Which languages are supported?</h3>
            <p className="mt-3 text-gray-400">
              Urdu, Kashmiri and English.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}