"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [teacherName, setTeacherName] = useState("");
  const [phone, setPhone] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [subject, setSubject] = useState("");
  const [session, setSession] = useState("");
  const [examination, setExamination] = useState("");
  const [marks, setMarks] = useState("");
  const [duration, setDuration] = useState("");
  const [medium, setMedium] = useState("");
  const [instructions, setInstructions] = useState("");
  const submittedBoxRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [school, setSchool] = useState("");

  const [submittedId, setSubmittedId] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
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

setLoading(true);

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

    const requestId =
   "REQ-" + Date.now();
    
    let fileUrl = "";

if (file) {
  const fileName = `${Date.now()}-${file.name}`;

  const { data, error: uploadError } =
    await supabase.storage
      .from("paper-uploads")
      .upload(fileName, file);

  if (uploadError) {
  alert("File upload failed");
  setLoading(false);
  return;
}

  fileUrl = data.path;
}
    const { error } = await supabase
  .from("paper_requests")
  .insert([
    {
      status: "Submitted",
      payment_status: "Unpaid",
      request_id: requestId,
      teacher_name: teacherName,
      school: school,
      phone: phone,
      class: studentClass,
      subject: subject,
      session: session,
      examination: examination,
      marks: marks,
      duration: duration,
      medium: medium,
      instructions: instructions,
      file_url: fileUrl,
    },
  ]);

    if (error) {
      alert("Error saving request");
      console.log(error);
      setLoading(false);
    } else {
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
  };

  return (
    <main className="min-h-screen p-4 sm:p-10">
      {loading && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-black border border-yellow-500 p-6 rounded-lg">
      <p className="text-yellow-400 text-lg">
        Processing Request...
      </p>
    </div>
  </div>
)}
      <h1 className="text-3xl text-yellow-500 font-bold mb-6">
        Kashmiri and Urdu Paper Writing Service
      </h1>

      <a
  href="/track"
  className="text-blue-600 underline block mb-6"
>
  Track your submitted paper
</a>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-md"
      >
        <input
          required
          type="text"
          placeholder="Teacher Name"
          value={teacherName}
          onChange={(e) =>
          setTeacherName(e.target.value)
          }
          className="border p-3 rounded w-full"
        />

        <input
        required
        type="text"
        placeholder="School Name"
        value={school}
        onChange={(e) =>
        setSchool(e.target.value)
        }
        className="border p-3 rounded w-full"
        />

        <input
          required
          type="tel"
          placeholder="Phone Number"
          value={phone}
          maxLength={12}
          onChange={(e) =>
          setPhone(e.target.value.replace(/\D/g, ""))
          }
          className="border p-3 rounded w-full"
        />

        <input
          required
          type="text"
          placeholder="Class"
          value={studentClass}
          onChange={(e) =>
            setStudentClass(e.target.value)
          }
          className="border p-3 rounded w-full"
        />

        <input
          required
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) =>
            setSubject(e.target.value)
          }
          className="border p-3 rounded w-full"
        />

        <input
          required
          type="text"
          placeholder="Session"
          value={session}
          onChange={(e) =>
          setSession(e.target.value)
          }
          className="border p-3 rounded w-full"
        />

        <input
          required
          type="text"
          placeholder="Examination"
          value={examination}
          onChange={(e) =>
          setExamination(e.target.value)
          }
          className="border p-3 rounded w-full"
        />

        <input
          required
          type="text"
          placeholder="Total Marks"
          value={marks}
          onChange={(e) =>
          setMarks(e.target.value.replace(/\D/g, ""))
          }
          className="border p-3 rounded w-full"
        />

        <input
          required
          type="text"
          placeholder="Duration"
          value={duration}
          onChange={(e) =>
          setDuration(e.target.value)
          }
          className="border p-3 rounded w-full"
        />

        <select
          required
          value={medium}
          onChange={(e) =>
          setMedium(e.target.value)
          }
          className="border p-3 rounded w-full bg-grey text-white focus:bg-white focus:text-black">

        <option value="">
        Select Medium
        </option>

        <option value="Urdu">
        Urdu
        </option>

        <option value="Kashmiri">
        Kashmiri
        </option>

        <option value="English">
        English
        </option>
        </select>

<textarea
  placeholder="Additional Instructions"
  value={instructions}
  onChange={(e) =>
    setInstructions(e.target.value)
  }
  className="border p-3 rounded"
/>

        <input
          required
          type="file"
        onChange={(e) => {
        if (e.target.files?.[0]) {
          setFile(e.target.files[0]);
        }
        }}
       className="border p-3 rounded w-full"
/>
        <button
  type="submit"
  disabled={loading}
  className="bg-yellow-500 text-black bold p-3 rounded w-full disabled:opacity-50"
>
  {loading ? "Submitting..." : "Submit Request"}
</button>

{submittedId && (
  <div 
    ref = {submittedBoxRef}
      className="border p-4 rounded mt-4 bg-black text-white">
    <p className="text-white mb-2">
      Request submitted!
    </p>

    <p className="font-bold text-white mb-2">
      Request ID: {submittedId}
    </p>

    <button
      type="button"
      onClick={async () => {
      await navigator.clipboard.writeText(submittedId);
      setCopied(true);

      setTimeout(() => {
      setCopied(false);
      }, 1500);
      }}

      className="bg-yellow-500 text-black px-4 py-2 rounded mt-2"
    >
      {copied ? "Copied!" : "Copy Request ID"}
    </button>
  </div>
)}
      </form>
    </main>
  );
}