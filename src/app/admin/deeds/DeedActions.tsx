"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeedActions({ deedId }: { deedId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const act = async (action: "approve" | "reject") => {
    setBusy(true);
    try {
      await fetch(`/api/admin/deeds/${deedId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act("approve")}
        disabled={busy}
        className="px-3 py-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
      >
        Approve
      </button>
      <button
        onClick={() => act("reject")}
        disabled={busy}
        className="px-3 py-1 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
      >
        Reject
      </button>
    </div>
  );
}
