"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  function login(e: React.FormEvent) {
    e.preventDefault();

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem(
      "adminLoginTime",
      Date.now().toString()
      );
      
      router.push("/admin");
    } else {
      alert("Wrong password");
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-10">
      <h1 className="text-3xl font-bold mb-6">
        Admin Login
      </h1>

      <form onSubmit={login} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-3 rounded w-full"
        />

        <button className="bg-black text-white p-3 rounded w-full disabled:opacity-50">
          Login
        </button>
      </form>
    </main>
  );
}