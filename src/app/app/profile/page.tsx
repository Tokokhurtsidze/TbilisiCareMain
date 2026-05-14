"use client";

import { useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, LogOut, Mail, Lock, User as UserIcon, Check, X } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { authErrorKey, useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-context";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { levelFor } from "@/types";

type EditMode = null | "name" | "email" | "password";

export default function ProfilePage() {
  const { t } = useI18n();
  const { user, userDoc, signOut, changeEmail, changePassword, changeDisplayName } =
    useAuth();
  useTheme();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  const isGoogle =
    user?.providerData.some((p) => p.providerId === "google.com") ?? false;

  const updateField = async (field: string, value: unknown) => {
    if (!user) return;
    await updateDoc(doc(db(), "users", user.uid), { [field]: value });
  };

  const onPickPhoto = async (file: File) => {
    if (!user || !file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoErr("File must be an image");
      return;
    }
    setPhotoErr(null);
    setUploading(true);
    try {
      const photoRef = ref(storage(), `users/${user.uid}/photo`);
      await uploadBytes(photoRef, file, { contentType: file.type });
      const url = await getDownloadURL(photoRef);
      await updateField("photoURL", url);
    } catch (e) {
      setPhotoErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const level = levelFor(userDoc?.carePoints ?? 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("profile.title")}</h1>

      <Card>
        <div className="flex items-center gap-4">
          <div className="relative">
            {userDoc?.photoURL ? (
              <img
                src={userDoc.photoURL}
                alt=""
                className="h-20 w-20 rounded-full object-cover bg-surface-subtle"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-surface-subtle grid place-items-center text-2xl font-semibold">
                {userDoc?.fullName?.[0] ?? "?"}
              </div>
            )}
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              aria-label={t("profile.changePhoto")}
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-brand text-white grid place-items-center shadow hover:bg-brand-hover disabled:opacity-60"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickPhoto(f);
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate">{userDoc?.fullName}</p>
            <p className="text-sm text-ink-secondary">{t(level.key)}</p>
            <p className="text-brand font-bold mt-1">
              {userDoc?.carePoints ?? 0} {t("home.points")}
            </p>
          </div>
        </div>
        <p className="text-xs text-ink-secondary mt-3">
          {uploading ? t("profile.uploading") : t("profile.changePhoto")}
        </p>
        {photoErr && <p className="text-sm text-danger mt-2">{photoErr}</p>}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-3">{t("profile.account")}</h2>
        <div className="space-y-3">
          <AccountRow
            icon={<UserIcon size={16} />}
            label={t("profile.nameLabel")}
            value={userDoc?.fullName || t("profile.notSet")}
            mode="name"
            renderEditor={(close, setMsg) => (
              <NameEditor
                close={close}
                setMsg={setMsg}
                onSave={changeDisplayName}
                initial={userDoc?.fullName ?? ""}
              />
            )}
          />
          <AccountRow
            icon={<Mail size={16} />}
            label={t("profile.emailLabel")}
            value={user?.email ?? t("profile.notSet")}
            mode="email"
            disabled={isGoogle}
            renderEditor={(close, setMsg) => (
              <EmailEditor close={close} setMsg={setMsg} onSave={changeEmail} />
            )}
          />
          <AccountRow
            icon={<Lock size={16} />}
            label={t("profile.passwordLabel")}
            value="••••••••"
            mode="password"
            disabled={isGoogle}
            renderEditor={(close, setMsg) => (
              <PasswordEditor
                close={close}
                setMsg={setMsg}
                onSave={changePassword}
              />
            )}
          />
        </div>
        {isGoogle && (
          <p className="text-xs text-ink-secondary mt-3">
            {t("profile.googleAccount")}
          </p>
        )}
      </Card>

      <Card>
        <p className="text-sm font-medium mb-3">{t("profile.language")}</p>
        <LanguageSwitcher />
      </Card>

      <Card>
        <p className="text-sm font-medium mb-3">{t("profile.theme")}</p>
        <ThemeToggle />
      </Card>

      <Card>
        <Toggle
          label={t("profile.elder")}
          checked={!!userDoc?.elderMode}
          onChange={(v) => updateField("elderMode", v)}
        />
      </Card>

      <Card>
        <Toggle
          label={t("profile.consent")}
          checked={!!userDoc?.consentLeaderboard}
          onChange={(v) => updateField("consentLeaderboard", v)}
        />
      </Card>

      <Button variant="ghost" className="w-full" onClick={signOut}>
        <LogOut size={18} />
        {t("auth.signout")}
      </Button>
    </div>
  );
}

function AccountRow({
  icon,
  label,
  value,
  mode,
  disabled,
  renderEditor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mode: EditMode;
  disabled?: boolean;
  renderEditor: (
    close: () => void,
    setMsg: (m: string | null, isErr?: boolean) => void,
  ) => React.ReactNode;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isErr, setIsErr] = useState(false);

  return (
    <div className="rounded-xl bg-surface-subtle p-3">
      <div className="flex items-center gap-3">
        <span className="text-brand">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-ink-secondary font-semibold">
            {label}
          </p>
          <p className="text-sm truncate">{value}</p>
        </div>
        {!disabled && (
          <button
            onClick={() => setOpen(!open)}
            className="text-sm text-brand font-medium px-2 py-1 rounded hover:bg-brand-soft whitespace-nowrap"
          >
            {open
              ? t("post.cancel")
              : mode === "name"
                ? t("profile.changeName")
                : mode === "email"
                  ? t("profile.changeEmail")
                  : t("profile.changePassword")}
          </button>
        )}
      </div>
      {open && !disabled && (
        <div className="mt-3">
          {renderEditor(
            () => {
              setOpen(false);
              setMsg(null);
            },
            (m, e) => {
              setMsg(m);
              setIsErr(!!e);
            },
          )}
        </div>
      )}
      {msg && (
        <p
          className={`text-xs mt-2 ${
            isErr ? "text-danger" : "text-success"
          }`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}

function FieldInput({
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full h-11 px-3 rounded-lg bg-surface-base border border-line focus:border-brand outline-none text-sm"
    />
  );
}

function NameEditor({
  close,
  setMsg,
  onSave,
  initial,
}: {
  close: () => void;
  setMsg: (m: string | null, isErr?: boolean) => void;
  onSave: (name: string) => Promise<void>;
  initial: string;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave(name.trim());
      setMsg(t("profile.saved"));
      close();
    } catch (e) {
      setMsg(t(authErrorKey(e)), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <FieldInput
        type="text"
        value={name}
        onChange={setName}
        placeholder={t("profile.newName")}
        autoComplete="name"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} loading={busy} disabled={!name.trim()}>
          <Check size={14} />
          {t("profile.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={close}>
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}

function EmailEditor({
  close,
  setMsg,
  onSave,
}: {
  close: () => void;
  setMsg: (m: string | null, isErr?: boolean) => void;
  onSave: (currentPassword: string, newEmail: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [pw, setPw] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!pw || !email) return;
    setBusy(true);
    try {
      await onSave(pw, email);
      setMsg(t("profile.saved"));
      close();
    } catch (e) {
      setMsg(t(authErrorKey(e)), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <FieldInput
        type="password"
        value={pw}
        onChange={setPw}
        placeholder={t("profile.currentPassword")}
        autoComplete="current-password"
      />
      <FieldInput
        type="email"
        value={email}
        onChange={setEmail}
        placeholder={t("profile.newEmail")}
        autoComplete="email"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} loading={busy} disabled={!pw || !email}>
          <Check size={14} />
          {t("profile.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={close}>
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}

function PasswordEditor({
  close,
  setMsg,
  onSave,
}: {
  close: () => void;
  setMsg: (m: string | null, isErr?: boolean) => void;
  onSave: (currentPassword: string, newPassword: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [pw, setPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!pw || !newPw) return;
    if (newPw.length < 6) {
      setMsg(t("auth.error.weakPassword"), true);
      return;
    }
    setBusy(true);
    try {
      await onSave(pw, newPw);
      setMsg(t("profile.saved"));
      close();
    } catch (e) {
      setMsg(t(authErrorKey(e)), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <FieldInput
        type="password"
        value={pw}
        onChange={setPw}
        placeholder={t("profile.currentPassword")}
        autoComplete="current-password"
      />
      <FieldInput
        type="password"
        value={newPw}
        onChange={setNewPw}
        placeholder={t("profile.newPassword")}
        autoComplete="new-password"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} loading={busy} disabled={!pw || !newPw}>
          <Check size={14} />
          {t("profile.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={close}>
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-medium">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-brand" : "bg-surface-subtle"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  );
}
