"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Chrome, Mail, Lock, User as UserIcon } from "lucide-react";
import { authErrorKey, useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function RegisterPage() {
  const { user, loading, signUpWithEmail, signInWithGoogle } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/app");
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) {
      setErr(t("auth.error.weakPassword"));
      return;
    }
    if (password !== confirm) {
      setErr(t("auth.error.mismatch"));
      return;
    }
    setBusy(true);
    try {
      await signUpWithEmail(email, password, name);
    } catch (e) {
      setErr(t(authErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setErr(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setErr(t(authErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-6">
          <LanguageSwitcher />
        </div>

        <div className="rounded-2xl bg-surface-elevated border border-line shadow-card p-8">
          <div className="h-14 w-14 rounded-2xl bg-brand text-white grid place-items-center text-2xl font-bold mx-auto mb-5">
            ც
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">
            {t("auth.signup.title")}
          </h1>
          <p className="text-center text-ink-secondary text-sm mb-6">
            {t("app.tagline")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field
              icon={<UserIcon size={16} />}
              type="text"
              value={name}
              onChange={setName}
              placeholder={t("auth.name")}
              autoComplete="name"
              required
            />
            <Field
              icon={<Mail size={16} />}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder={t("auth.email")}
              autoComplete="email"
              required
            />
            <Field
              icon={<Lock size={16} />}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={t("auth.password")}
              autoComplete="new-password"
              required
            />
            <Field
              icon={<Lock size={16} />}
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder={t("auth.confirmPassword")}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={busy}
              disabled={!name || !email || !password || !confirm}
            >
              {t("auth.signup.cta")}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs uppercase tracking-widest text-ink-secondary">
              {t("auth.or")}
            </span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            <Chrome size={18} />
            {t("auth.signin.google")}
          </Button>

          {err && (
            <p className="mt-4 text-sm text-danger" role="alert">
              {err}
            </p>
          )}

          <p className="text-center text-sm text-ink-secondary mt-6">
            {t("auth.haveAccount")}{" "}
            <Link href="/auth/login" className="text-brand font-semibold">
              {t("auth.signin")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({
  icon,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-surface-base border border-line focus-within:border-brand h-12 px-3">
      <span className="text-ink-secondary">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="flex-1 bg-transparent outline-none text-base"
      />
    </label>
  );
}
