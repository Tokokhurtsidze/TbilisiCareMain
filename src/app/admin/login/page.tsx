"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "otp";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "otp") otpRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const t = setInterval(() => setRetryAfter((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [retryAfter]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) {
          setRetryAfter(data.retryAfter ?? 60);
          setError(`OTP already sent. Retry in ${data.retryAfter}s.`);
        } else if (res.status === 403) {
          setError("Email not authorized as admin.");
        } else {
          setError(data.error ?? "Failed to send OTP. Try again.");
        }
        return;
      }
      setStep("otp");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msgs: Record<string, string> = {
          invalid_otp: "Wrong code. Check your email.",
          otp_expired: "Code expired. Request a new one.",
          otp_already_used: "Code already used. Request a new one.",
        };
        setError(msgs[data.error] ?? "Verification failed.");
        return;
      }
      router.push("/admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-white text-2xl font-bold mb-1">Admin Login</h1>
        <p className="text-gray-400 text-sm mb-8">TbilisiCare Admin Panel</p>

        {step === "email" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1.5">
                Admin email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !email}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition-colors"
            >
              {busy ? "Sending…" : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-gray-400 text-sm">
              Code sent to <span className="text-white">{email}</span>
            </p>
            <div>
              <label className="block text-gray-300 text-sm mb-1.5">
                6-digit code
              </label>
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors tracking-[0.5em] text-xl text-center font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={busy || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition-colors"
            >
              {busy ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setError(null); }}
              disabled={retryAfter > 0}
              className="w-full text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-colors"
            >
              {retryAfter > 0 ? `Resend in ${retryAfter}s` : "Resend code"}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
