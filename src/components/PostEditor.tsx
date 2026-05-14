"use client";

import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Trash2,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import type { Post, ProofType } from "@/types";

type MediaMode = "keep" | "remove" | "replace";

const UPLOAD_TIMEOUT_MS = 15_000;

export function PostEditor({
  post,
  onDone,
}: {
  post: Post;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [text, setText] = useState(post.text);
  const [mediaMode, setMediaMode] = useState<MediaMode>("keep");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "saving">("idle");
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!newFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(newFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [newFile]);

  const newMediaType: ProofType | null = newFile
    ? newFile.type.startsWith("video/")
      ? "video"
      : newFile.type.startsWith("image/")
        ? "image"
        : null
    : null;

  const uploadMedia = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!user) return reject(new Error("no user"));
      const ext = file.type.startsWith("video/") ? "mp4" : "jpg";
      const r = ref(storage(), `posts/${user.uid}/${post.id}/media.${ext}`);
      const task = uploadBytesResumable(r, file, { contentType: file.type });
      const timer = setTimeout(() => {
        task.cancel();
        reject(new Error("upload timed out (15s)"));
      }, UPLOAD_TIMEOUT_MS);
      task.on(
        "state_changed",
        (s) =>
          setProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
        (e) => {
          clearTimeout(timer);
          reject(e);
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

  const save = async () => {
    if (!user || !text.trim()) return;
    setErr(null);

    const patch: Record<string, unknown> = {
      text: text.trim().slice(0, 2000),
      editedAt: serverTimestamp(),
    };

    try {
      if (mediaMode === "remove") {
        patch.mediaUrl = null;
        patch.mediaType = null;
      } else if (mediaMode === "replace" && newFile && newMediaType) {
        setStatus("uploading");
        try {
          patch.mediaUrl = await uploadMedia(newFile);
          patch.mediaType = newMediaType;
        } catch (e) {
          console.warn("media upload failed, keeping existing media", e);
          // Fall through — keep existing media
        }
      }

      setStatus("saving");
      await updateDoc(doc(db(), "posts", post.id), patch);
      setStatus("idle");
      onDone();
    } catch (e) {
      setErr((e as Error).message || t("post.edit.failed"));
      setStatus("idle");
    }
  };

  const pickReplacement = () => fileInput.current?.click();

  // Decide what media to show:
  // - keep: original
  // - remove: nothing
  // - replace: preview of new file (or original if file not yet selected)
  const showOriginal =
    mediaMode === "keep" && post.mediaUrl && post.mediaType;
  const showReplacement = mediaMode === "replace" && preview && newMediaType;

  return (
    <div className="space-y-3">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("post.edit.placeholder")}
        rows={4}
        maxLength={2000}
        className="w-full p-3 rounded-xl bg-surface-base border border-line focus:border-brand outline-none text-base resize-none"
      />

      {showOriginal && (
        <div className="rounded-xl overflow-hidden bg-black relative">
          {post.mediaType === "video" ? (
            <video
              src={post.mediaUrl!}
              controls
              playsInline
              className="w-full max-h-[300px]"
            />
          ) : (
            <img
              src={post.mediaUrl!}
              alt=""
              className="w-full max-h-[300px] object-cover"
            />
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={pickReplacement}
              className="h-9 px-3 grid place-items-center rounded-full bg-black/60 text-white text-xs font-medium hover:bg-black/80"
            >
              {t("post.edit.replaceMedia")}
            </button>
            <button
              onClick={() => setMediaMode("remove")}
              aria-label={t("post.edit.removeMedia")}
              className="h-9 w-9 grid place-items-center rounded-full bg-black/60 text-white hover:bg-danger"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {showReplacement && (
        <div className="rounded-xl overflow-hidden bg-black relative">
          {newMediaType === "video" ? (
            <video
              src={preview!}
              controls
              playsInline
              className="w-full max-h-[300px]"
            />
          ) : (
            <img
              src={preview!}
              alt=""
              className="w-full max-h-[300px] object-cover"
            />
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={() => {
                setNewFile(null);
                setMediaMode(post.mediaUrl ? "keep" : "remove");
              }}
              aria-label="Revert"
              className="h-9 w-9 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => {
                setNewFile(null);
                setMediaMode("remove");
              }}
              aria-label={t("post.edit.removeMedia")}
              className="h-9 w-9 grid place-items-center rounded-full bg-black/60 text-white hover:bg-danger"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {mediaMode === "remove" && (
        <div className="rounded-xl bg-surface-subtle p-4 flex items-center justify-between">
          <span className="text-sm text-ink-secondary">
            {t("post.edit.addMedia")}
          </span>
          <Button variant="secondary" size="sm" onClick={pickReplacement}>
            <ImageIcon size={14} />
            {t("post.edit.addMedia")}
          </Button>
        </div>
      )}

      {status === "uploading" && (
        <div className="h-1.5 rounded-full bg-surface-subtle overflow-hidden">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setNewFile(f);
            setMediaMode("replace");
          }
          e.target.value = "";
        }}
      />

      {err && <p className="text-sm text-danger">{err}</p>}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDone}
          disabled={status !== "idle"}
        >
          <X size={14} />
          {t("common.cancel")}
        </Button>
        <Button
          size="sm"
          onClick={save}
          loading={status !== "idle"}
          disabled={!text.trim() || status !== "idle"}
        >
          <Check size={14} />
          {status === "uploading" || status === "saving"
            ? t("common.saving")
            : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
