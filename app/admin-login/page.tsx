"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const result = await res.json();

    if (!result.success) {
      setLoading(false);
      setError(result.error || "Wrong password. Please try again.");
      return;
    }

    localStorage.setItem("isAdmin", "true");
    localStorage.setItem("adminLoginTime", Date.now().toString());

    router.push("/admin");
  }

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10 animate-fade-in">
      <section className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-yellow-500/20 bg-zinc-950 p-8 shadow-lg">
          <p className="mb-4 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400">
            Admin Access
          </p>

          <h1 className="text-4xl font-bold text-yellow-500">
            Admin Login
          </h1>

          <p className="mb-6 mt-3 text-gray-400">
            Enter your admin password to manage requests, uploads, payments, and archive.
          </p>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="font-semibold text-red-400">⚠ Login Failed</p>
              <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={login} className="mt-8 flex flex-col gap-4">
            <input
              required
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="rounded border border-yellow-500/20 bg-black p-3 text-white outline-none focus:border-yellow-500"
            />

            <button
              disabled={loading}
              className="rounded bg-yellow-500 p-3 font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}