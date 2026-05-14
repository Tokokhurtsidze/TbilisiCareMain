"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapPin,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  X,
} from "lucide-react";
import {
  collection,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TASK_TYPES, levelFor, type ProofType, type TaskTypeId } from "@/types";

type Coords = { lat: number; lng: number } | null;

export default function SubmitPage() {
  const { t } = useI18n();
  const { user, userDoc } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const preset = search.get("type") as TaskTypeId | null;

  const [taskType, setTaskType] = useState<TaskTypeId | null>(preset);
  const [proof, setProof] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [coords, setCoords] = useState<Coords>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "done">(
    "idle",
  );
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!proof) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(proof);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proof]);

  const proofType: ProofType | null = proof
    ? proof.type.startsWith("video/")
      ? "video"
      : proof.type.startsWith("image/")
        ? "image"
        : null
    : null;

  // The only true requirement: pick a task type. Everything else is optional.
  const ready = !!taskType && !!user && !!userDoc;

  const UPLOAD_TIMEOUT_MS = 15_000;

  const uploadProof = (file: File, deedId: string): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!user) return reject(new Error("no user"));
      const ext = file.type.startsWith("video/") ? "mp4" : "jpg";
      const proofRef = ref(
        storage(),
        `deeds/${user.uid}/${deedId}/proof.${ext}`,
      );
      const task = uploadBytesResumable(proofRef, file, {
        contentType: file.type,
      });

      const timer = setTimeout(() => {
        task.cancel();
        reject(new Error("upload timed out (15s)"));
      }, UPLOAD_TIMEOUT_MS);

      task.on(
        "state_changed",
        (s) =>
          setProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
        async () => {
          clearTimeout(timer);
          try {
            resolve(await getDownloadURL(task.snapshot.ref));
          } catch (e) {
            reject(e);
          }
        },
      );
    });

  const handleSubmit = async () => {
    if (!ready || !user || !userDoc || !taskType) return;
    setErr(null);
    setProgress(0);
    try {
      const deedRef = doc(collection(db(), "deeds"));
      const deedId = deedRef.id;

      let proofUrl: string | null = null;
      let pType: ProofType | null = null;
      if (proof && proofType) {
        setStatus("uploading");
        try {
          proofUrl = await uploadProof(proof, deedId);
          pType = proofType;
        } catch (e) {
          // Demo-friendly: if upload fails (e.g. Storage not enabled),
          // still award the points so the user is not blocked.
          console.warn("proof upload failed, continuing without it:", e);
        }
      }

      setStatus("saving");

      const taskMeta = TASK_TYPES.find((x) => x.id === taskType)!;
      const newPoints = (userDoc.carePoints ?? 0) + taskMeta.basePoints;
      const newLevel = levelFor(newPoints).level;

      const batch = writeBatch(db());
      batch.set(deedRef, {
        userId: user.uid,
        authorName: userDoc.fullName || user.displayName || "Citizen",
        authorPhotoURL: userDoc.photoURL ?? user.photoURL ?? null,
        authorPoints: newPoints,
        authorLevel: newLevel,
        taskTypeId: taskType,
        status: "approved",
        declaredLat: coords?.lat ?? null,
        declaredLng: coords?.lng ?? null,
        proofType: pType,
        proofUrl,
        cvConfidence: null,
        pointsAwarded: taskMeta.basePoints,
        caption: caption.trim() || null,
        commentCount: 0,
        createdAt: serverTimestamp(),
        validatedAt: serverTimestamp(),
      });
      batch.update(doc(db(), "users", user.uid), {
        carePoints: increment(taskMeta.basePoints),
        level: newLevel,
      });
      await batch.commit();

      setStatus("done");
      setTimeout(() => router.replace("/app"), 600);
    } catch (e) {
      setErr((e as Error).message);
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center">
        <div>
          <CheckCircle2 size={64} className="text-success mx-auto mb-3" />
          <p className="text-lg font-semibold">{t("submit.success")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("submit.title")}</h1>

      <div className="rounded-xl bg-brand-soft text-brand text-sm font-medium px-4 py-3">
        {t("submit.demoNotice")}
      </div>

      <Card>
        <p className="text-sm font-medium mb-3">{t("submit.choose")}</p>
        <div className="grid grid-cols-2 gap-2">
          {TASK_TYPES.map((task) => (
            <button
              key={task.id}
              onClick={() => setTaskType(task.id)}
              className={`p-3 rounded-xl text-sm font-medium text-left transition border ${
                taskType === task.id
                  ? "bg-brand text-white border-brand"
                  : "bg-surface-subtle border-line text-ink-primary"
              }`}
            >
              {t(`task.${task.id}`)}
              <div className="text-xs opacity-80 mt-0.5">+{task.basePoints} CP</div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-medium mb-3">{t("submit.proof.optional")}</p>
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => setProof(e.target.files?.[0] ?? null)}
        />

        {preview ? (
          <div className="rounded-xl overflow-hidden bg-black mb-3 relative">
            {proofType === "video" ? (
              <video src={preview} controls playsInline className="w-full max-h-[320px]" />
            ) : (
              <img src={preview} alt="" className="w-full max-h-[320px] object-cover" />
            )}
            <button
              onClick={() => setProof(null)}
              className="absolute top-2 right-2 h-9 w-9 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Remove"
            >
              <X size={18} />
            </button>
          </div>
        ) : null}

        <Button
          variant={proof ? "secondary" : "ghost"}
          className="w-full"
          onClick={() => fileInput.current?.click()}
        >
          {proofType === "video" ? (
            <Video size={18} />
          ) : proofType === "image" ? (
            <ImageIcon size={18} />
          ) : (
            <Upload size={18} />
          )}
          {proof ? proof.name : t("submit.proof.choose")}
        </Button>
      </Card>

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
              {coords
                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                : "—"}
            </p>
          </div>
        </div>
      </Card>

      {status === "uploading" && (
        <div className="rounded-xl bg-surface-subtle p-3">
          <div className="flex items-center justify-between text-xs text-ink-secondary mb-2">
            <span>{t("submit.progress", { pct: progress })}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-base overflow-hidden">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {err && <p className="text-sm text-danger">{err}</p>}

      <Button
        size="lg"
        className="w-full"
        disabled={!ready || status === "uploading" || status === "saving"}
        loading={status === "uploading" || status === "saving"}
        onClick={handleSubmit}
      >
        {status === "uploading"
          ? t("submit.uploading")
          : status === "saving"
            ? t("common.loading")
            : t("submit.send")}
      </Button>
    </div>
  );
}
