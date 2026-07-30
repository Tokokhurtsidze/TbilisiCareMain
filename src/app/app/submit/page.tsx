"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapPin,
  Upload,
  XCircle,
  Clock,
  Image as ImageIcon,
  Video,
  X,
  Trash2,
  Dog,
  HeartHandshake,
  SprayCan,
  Trees,
} from "lucide-react";
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TASK_TYPES, midpointPoints, type ProofType, type TaskTypeId } from "@/types";

type Coords = { lat: number; lng: number } | null;
type Stage =
  | "idle"
  | "uploading"
  | "saving"
  | "validating"
  | "rejected"
  | "review";

export default function SubmitPage() {
  const { t } = useI18n();
  const { user, userDoc } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const preset = search.get("type") as TaskTypeId | null;

  const [taskType, setTaskType] = useState<TaskTypeId | null>(preset);
  const [before, setBefore] = useState<File | null>(null);
  const [after, setAfter] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [coords, setCoords] = useState<Coords>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{ reason?: string; suggestedPoints?: number } | null>(null);
  const beforeInput = useRef<HTMLInputElement>(null);
  const afterInput = useRef<HTMLInputElement>(null);

  const task = TASK_TYPES.find((x) => x.id === taskType) ?? null;

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!before) {
      setBeforePreview(null);
      return;
    }
    const url = URL.createObjectURL(before);
    setBeforePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [before]);

  useEffect(() => {
    if (!after) {
      setAfterPreview(null);
      return;
    }
    const url = URL.createObjectURL(after);
    setAfterPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [after]);

  const fileType = (f: File | null): ProofType | null =>
    f ? (f.type.startsWith("video/") ? "video" : f.type.startsWith("image/") ? "image" : null) : null;

  const afterType = fileType(after);

  const ready =
    !!task &&
    !!after &&
    (!task.beforeAfter || !!before) &&
    !!user &&
    !!userDoc;

  const UPLOAD_STALL_TIMEOUT_MS = 30_000;

  const uploadProof = async (file: File, deedId: string, slot: "before" | "after"): Promise<string> => {
    if (!user) throw new Error("no user");
    const idToken = await user.getIdToken();
    const signRes = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ kind: "deed", deedId, slot, contentType: file.type }),
    });
    const signed = await signRes.json().catch(() => ({}));
    if (!signRes.ok || !signed.signedUrl) {
      throw new Error(signed.error ? `upload sign failed: ${signed.error}` : "upload sign failed");
    }

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signed.signedUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      // Timeout resets on every progress tick — only fires if the upload actually stalls,
      // not just because a large file is slow on a weak connection.
      let timer: ReturnType<typeof setTimeout>;
      const arm = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          xhr.abort();
          reject(new Error("upload stalled (no progress for 30s)"));
        }, UPLOAD_STALL_TIMEOUT_MS);
      };
      arm();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        arm();
      };
      xhr.onerror = () => {
        clearTimeout(timer);
        reject(new Error("upload failed"));
      };
      xhr.onload = () => {
        clearTimeout(timer);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(signed.publicUrl);
        } else {
          reject(new Error(`upload failed (${xhr.status})`));
        }
      };
      xhr.send(file);
    });
  };

  const reset = () => {
    setBefore(null);
    setAfter(null);
    setCaption("");
    setStage("idle");
    setProgress(0);
    setErr(null);
    setOutcome(null);
  };

  const handleSubmit = async () => {
    if (!ready || !user || !userDoc || !task) return;
    setErr(null);
    setProgress(0);
    try {
      const deedRef = doc(collection(db(), "deeds"));
      const deedId = deedRef.id;

      setStage("uploading");
      const afterUrl = await uploadProof(after!, deedId, "after");
      const beforeUrl = task.beforeAfter ? await uploadProof(before!, deedId, "before") : null;

      setStage("saving");
      const batch = writeBatch(db());
      batch.set(deedRef, {
        userId: user.uid,
        authorName: userDoc.fullName || user.displayName || "Citizen",
        authorPhotoURL: userDoc.photoURL ?? user.photoURL ?? null,
        authorPoints: userDoc.carePoints ?? 0,
        authorLevel: userDoc.level ?? 1,
        taskTypeId: task.id,
        status: "pending",
        declaredLat: coords?.lat ?? null,
        declaredLng: coords?.lng ?? null,
        proofType: afterType,
        proofUrl: afterUrl,
        proofBeforeUrl: beforeUrl,
        cvConfidence: null,
        rejectionReason: null,
        pointsAwarded: midpointPoints(task),
        caption: caption.trim() || null,
        commentCount: 0,
        createdAt: serverTimestamp(),
        validatedAt: null,
      });
      await batch.commit();

      setStage("validating");
      const idToken = await user.getIdToken();
      const res = await fetch("/api/deeds/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ deedId }),
      });
      const result = await res.json().catch(() => ({}));

      // Don't silently treat a real failure (expired token, network blip,
      // server error) as "sent for review" — surface it as an actual error.
      if (!res.ok && result.status !== "rejected" && result.status !== "review") {
        throw new Error(result.error ? `validation failed: ${result.error}` : "validation failed");
      }

      if (result.status === "rejected") {
        setOutcome({ reason: result.reason });
        setStage("rejected");
      } else if (result.status === "review") {
        setOutcome({ reason: result.reason, suggestedPoints: result.suggestedPoints });
        setStage("review");
      } else {
        throw new Error("unexpected validation response");
      }
    } catch (e) {
      setErr((e as Error).message);
      setStage("idle");
    }
  };

  const SUBMIT_ICONS = {
    "trash-2": Trash2,
    dog: Dog,
    "heart-handshake": HeartHandshake,
    "spray-can": SprayCan,
    trees: Trees,
  } as const;

  if (stage === "rejected" || stage === "review") {
    const isReview = stage === "review";
    return (
      <div className="min-h-[60vh] grid place-items-center text-center px-6">
        <div className="space-y-4 max-w-sm">
          {isReview ? (
            <Clock size={64} className="text-brand mx-auto" />
          ) : (
            <XCircle size={64} className="text-danger mx-auto" />
          )}
          <p className="text-xl font-extrabold tracking-tight">
            {isReview ? t("submit.review.title") : t("submit.rejected.title")}
          </p>
          <p className="text-sm text-ink-secondary leading-relaxed">
            {isReview ? t("submit.review.body") : t("submit.rejected.body")}
          </p>
          {isReview && typeof outcome?.suggestedPoints === "number" && (
            <div className="inline-flex flex-col items-center gap-1 px-6 py-3 rounded-2xl bg-brand-soft border border-brand/20">
              <p className="text-3xl font-extrabold text-brand tabular-nums">+{outcome.suggestedPoints}</p>
              <p className="text-xs font-semibold text-brand uppercase tracking-wider">{t("submit.suggestedPoints")}</p>
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <Button variant="ghost" onClick={reset}>
              {t("submit.retry")}
            </Button>
            <Button onClick={() => router.replace("/app")}>{t("post.back")}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("submit.title")}</h1>

      <div className="rounded-xl bg-brand-soft text-brand text-sm font-medium px-4 py-3 border border-brand/20">
        {t("submit.demoNotice")}
      </div>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-3">{t("submit.choose")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TASK_TYPES.map((tt) => {
            const Icon = SUBMIT_ICONS[tt.icon as keyof typeof SUBMIT_ICONS];
            const active = taskType === tt.id;
            return (
              <button
                key={tt.id}
                onClick={() => setTaskType(tt.id)}
                className={`p-3.5 rounded-xl text-sm font-semibold text-left transition-all duration-200 border flex items-start gap-3 group ${
                  active
                    ? "bg-brand text-white border-brand shadow-[var(--shadow-brand)]"
                    : "bg-surface-subtle border-line text-ink-primary hover:border-brand hover:bg-brand-soft"
                }`}
              >
                <div className={`mt-0.5 rounded-lg p-1.5 shrink-0 ${active ? "bg-white/20" : "bg-surface-base"}`}>
                  {Icon && <Icon size={16} className={active ? "text-white" : "text-brand"} strokeWidth={1.7} />}
                </div>
                <div className="min-w-0">{t(`task.${tt.id}`)}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {task?.beforeAfter && (
        <ProofSlot
          label={t("submit.before")}
          file={before}
          preview={beforePreview}
          onPick={(f) => setBefore(f)}
          inputRef={beforeInput}
          accept="image/*"
        />
      )}

      <ProofSlot
        label={task?.beforeAfter ? t("submit.after") : t("submit.proof")}
        file={after}
        preview={afterPreview}
        onPick={(f) => setAfter(f)}
        inputRef={afterInput}
        accept={task?.beforeAfter ? "image/*" : "image/*,video/*"}
      />

      <Card>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t("comments.placeholder")}
          maxLength={280}
          className="w-full h-12 px-4 rounded-xl bg-surface-base border border-line focus:border-brand outline-none text-base"
        />
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <MapPin size={20} className="text-brand" />
          <div className="text-sm">
            <p className="font-medium">{t("submit.location")}</p>
            <p className="text-ink-secondary">
              {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "—"}
            </p>
          </div>
        </div>
      </Card>

      {stage === "uploading" && (
        <div className="rounded-xl bg-surface-subtle p-3">
          <div className="flex items-center justify-between text-xs text-ink-secondary mb-2">
            <span>{t("submit.progress", { pct: progress })}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-base overflow-hidden">
            <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {stage === "validating" && (
        <div className="rounded-xl bg-surface-subtle p-3 text-sm text-ink-secondary flex items-center gap-2">
          <Clock size={16} className="text-brand animate-pulse" />
          {t("submit.validating")}
        </div>
      )}

      {err && <p className="text-sm text-danger">{err}</p>}

      <Button
        size="lg"
        className="w-full"
        disabled={!ready || stage !== "idle"}
        loading={stage === "uploading" || stage === "saving" || stage === "validating"}
        onClick={handleSubmit}
      >
        {stage === "uploading"
          ? t("submit.uploading")
          : stage === "saving"
            ? t("common.loading")
            : stage === "validating"
              ? t("submit.validating")
              : t("submit.send")}
      </Button>
    </div>
  );
}

function ProofSlot({
  label,
  file,
  preview,
  onPick,
  inputRef,
  accept,
}: {
  label: string;
  file: File | null;
  preview: string | null;
  onPick: (f: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  accept: string;
}) {
  const { t } = useI18n();
  const isVideo = file?.type.startsWith("video/");

  return (
    <Card>
      <p className="text-sm font-medium mb-3">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        <div className="rounded-xl overflow-hidden bg-black mb-3 relative">
          {isVideo ? (
            <video src={preview} controls playsInline className="w-full max-h-[320px]" />
          ) : (
            <img src={preview} alt="" className="w-full max-h-[320px] object-cover" />
          )}
          <button
            onClick={() => onPick(null)}
            className="absolute top-2 right-2 h-9 w-9 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remove"
          >
            <X size={18} />
          </button>
        </div>
      ) : null}

      <Button variant={file ? "secondary" : "ghost"} className="w-full" onClick={() => inputRef.current?.click()}>
        {isVideo ? <Video size={18} /> : file ? <ImageIcon size={18} /> : <Upload size={18} />}
        {file ? file.name : t("submit.proof.choose")}
      </Button>
    </Card>
  );
}
