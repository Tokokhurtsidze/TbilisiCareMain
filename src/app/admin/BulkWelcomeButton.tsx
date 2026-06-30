"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function BulkWelcomeButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const send = async () => {
    if (!confirm("Send welcome email to ALL existing users? This cannot be undone.")) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/bulk-welcome", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(`Error: ${data.error ?? "unknown"}`);
      } else {
        setResult(`Done — sent: ${data.sent}, failed: ${data.failed}`);
      }
    } catch (e) {
      setResult("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <Mail size={18} className="text-blue-400" />
        <span className="text-white font-medium text-sm">Bulk Welcome Email</span>
      </div>
      <p className="text-gray-400 text-xs mb-4">
        Send welcome email to all existing registered users (one-time action).
      </p>
      <button
        onClick={send}
        disabled={busy}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {busy ? "Sending…" : "Send to all users"}
      </button>
      {result && (
        <p className={`mt-3 text-sm ${result.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
          {result}
        </p>
      )}
    </div>
  );
}
