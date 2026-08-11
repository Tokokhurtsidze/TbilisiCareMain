"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteChallengeButton({ week }: { week: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const del = async () => {
    if (!window.confirm(`Delete the challenge for ${week}?`)) return;
    setBusy(true);
    try {
      await fetch("/api/admin/weekly-challenge", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={del}
      disabled={busy}
      className="px-3 py-1 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
    >
      Delete
    </button>
  );
}
