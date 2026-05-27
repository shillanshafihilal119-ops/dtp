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
        body: JSON.stringify({
          prices: prices.map((price) => ({
            ...price,
            rate_per_page: Number(price.rate_per_page || 1),
          })),
        }),
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
    <main className="min-h-screen px-4 py-7 sm:px-10 sm:py-12">
      {toast && (
        <div className="fixed right-4 top-4 z-9999 rounded-2xl border border-green-500/20 bg-zinc-950 p-4 shadow-xl sm:right-6 sm:top-6 sm:p-5">
          <p className="font-bold text-green-400">Success</p>
          <p className="mt-1 text-sm text-gray-300">{toast}</p>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-4 inline-block rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-400 sm:mb-3">
              Admin Pricing
            </p>

            <h1 className="text-3xl font-bold text-yellow-500 sm:text-4xl">
              Pricing Settings
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-400 sm:text-base">
              Manage per-page rates used when final PDFs are uploaded.
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
              href="/admin/payments"
              className="rounded border border-yellow-500/30 px-4 py-3 text-center font-semibold text-yellow-400 hover:border-yellow-500 hover:bg-yellow-500/10 sm:py-2"
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
          <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-4 shadow-lg sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {prices.map((price, index) => (
                <div
                  key={price.medium}
                  className="rounded-xl border border-yellow-500/10 bg-black/40 p-4 sm:p-5"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500 sm:text-sm">
                    Medium
                  </p>

                  <p className="mt-1 wrap-break-word text-xl font-bold text-yellow-400 sm:text-2xl">
                    {price.medium}
                  </p>

                  <label className="mt-4 block text-sm font-semibold text-gray-300 sm:mt-6">
                    Rate / page
                  </label>

                  <div className="mt-2 flex items-center rounded border border-yellow-500/20 bg-black/60 focus-within:border-yellow-500">
                    <span className="px-3 text-lg font-bold text-yellow-400 sm:px-4">
                      ₹
                    </span>

                    <input
                      type="number"
                      min={1}
                      value={price.rate_per_page ?? ""}
                      onChange={(e) => {
                        const updated = [...prices];

                        updated[index] = {
                          ...updated[index],
                          rate_per_page:
                            e.target.value === "" ? "" : Number(e.target.value),
                        };

                        setPrices(updated);
                      }}
                      onBlur={() => {
                        const updated = [...prices];

                        updated[index] = {
                          ...updated[index],
                          rate_per_page:
                            Number(updated[index].rate_per_page) > 0
                              ? Number(updated[index].rate_per_page)
                              : 1,
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
              className="mt-5 w-full rounded bg-yellow-500 px-5 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50 sm:mt-6 sm:w-auto"
            >
              {savingPrices ? "Saving..." : "Save Pricing"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}