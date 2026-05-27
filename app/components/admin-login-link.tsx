"use client";

import { useEffect, useState } from "react";

export default function AdminLoginLink() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(localStorage.getItem("vintage_admin_entry") === "allowed");
  }, []);

  if (!allowed) return null;

  return (
    <a
      href="/admin-login"
      className="rounded bg-yellow-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400 sm:px-4 sm:text-base"
    >
      Admin Login
    </a>
  );
}