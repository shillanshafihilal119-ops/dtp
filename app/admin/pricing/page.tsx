"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPricingPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [savingPrices, setSavingPrices] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    fetchPricing();
  }, []);

  async function fetchPricing() {
    setLoading(true);

    const { data, error } = await supabase
      .from("pricing_settings")
      .select("*")
      .order("medium", { ascending: true });

    setLoading(false);

    if (error) {
      console.log(error);
      alert("Failed to load pricing");
    } else {
      setPrices(data || []);
    }
  }

  async function savePricing() {
    try {
      setSavingPrices(true);

      const res = await fetch("/api/admin-pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": process.env.NEXT_PUBLIC_ADMIN_PASSWORD!,
        },
        body: JSON.stringify({ prices }),
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.error || "Failed to update pricing");
        return;
      }

      showToast("Pricing updated successfully");
      fetchPricing();
    } catch (error) {
      console.log(error);
      alert("Failed to update pricing");
    } finally {
      setSavingPrices(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10 animate-fade-in">
      {toast && (
        <div className="fixed right-6 top-6 z-9999 rounded-2xl border border-green-500/20 bg-zinc-950 p-5 shadow-xl">
          <p className="font-bold text-green-400">Success</p>
          <p className="mt-1 text-sm text-gray-300">{toast}</p>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-3 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400">
              Admin Pricing
            </p>

            <h1 className="text-4xl font-bold text-yellow-500">
              Pricing Settings
            </h1>

            <p className="mt-2 text-gray-400">
              Manage per-page rates used when final PDFs are uploaded.
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
              href="/admin/payments"
              className="rounded border border-yellow-500/30 px-4 py-2 font-semibold text-yellow-400 hover:border-yellow-500 hover:bg-yellow-500/10"
            >
              Payments
            </a>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-8 text-center">
            <p className="text-yellow-400">Loading pricing...</p>
          </div>
        )}

        {!loading && (
          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 shadow-lg">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {prices.map((price, index) => (
                <div
                  key={price.medium}
                  className="rounded-xl border border-yellow-500/10 bg-black/40 p-5"
                >
                  <p className="text-sm uppercase tracking-wide text-gray-500">
                    Medium
                  </p>

                  <p className="mt-1 text-2xl font-bold text-yellow-400">
                    {price.medium}
                  </p>

                  <label className="mt-6 block text-sm font-semibold text-gray-300">
                    Rate per page
                  </label>

                  <div className="mt-2 flex items-center rounded border border-yellow-500/20 bg-black/60 focus-within:border-yellow-500">
                    <span className="px-4 text-lg font-bold text-yellow-400">
                      ₹
                    </span>

                    <input
                      type="number"
                      min={1}
                      value={price.rate_per_page}
                      onChange={(e) => {
                        const updated = [...prices];
                        updated[index] = {
                          ...updated[index],
                          rate_per_page: Number(e.target.value),
                        };
                        setPrices(updated);
                      }}
                      className="w-full bg-transparent p-3 text-lg font-bold text-white outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={savePricing}
              disabled={savingPrices}
              className="mt-6 rounded bg-yellow-500 px-5 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
            >
              {savingPrices ? "Saving..." : "Save Pricing"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}