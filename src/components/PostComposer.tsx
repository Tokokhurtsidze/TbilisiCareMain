"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Video, X, Send, User } from "lucide-react";
import {
  addDoc,
  collection,
  serverTimestamp,
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
import type { ProofType } from "@/types";

export function PostComposer() {
  const { t } = useI18n();
  const { user, userDoc } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "saving">("idle");
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!media) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(media);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [media]);

  const mediaType: ProofType | null = media
    ? media.type.startsWith("video/")
      ? "video"
      : media.type.startsWith("image/")
        ? "image"
        : null
    : null;

  const reset = () => {
    setText("");
    setMedia(null);
    setExpanded(false);
    setProgress(0);
    setErr(null);
  };

  const UPLOAD_TIMEOUT_MS = 15_000;

  const uploadMedia = (file: File, postId: string): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!user) return reject(new Error("no user"));
      const ext = file.type.startsWith("video/") ? "mp4" : "jpg";
      const r = ref(storage(), `posts/${user.uid}/${postId}/media.${ext}`);
      const task = uploadBytesResumable(r, file, { contentType: file.type });

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

  const publish = async () => {
    if (!user || !userDoc || !text.trim()) return;
    setErr(null);
    try {
      const postsCol = collection(db(), "posts");
      // Generate id by addDoc afterwards; for media upload we need an id, so
      // use a client-side temp id then re-upload if needed. Simpler: addDoc
      // first without media, then upload + update — but for demo we'll mint
      // a uuid for both paths.
      const postId = crypto.randomUUID();

      let mediaUrl: string | null = null;
      let mType: ProofType | null = null;
      if (media && mediaType) {
        setStatus("uploading");
        try {
          mediaUrl = await uploadMedia(media, postId);
          mType = mediaType;
        } catch (e) {
          console.warn("media upload failed, posting without it:", e);
        }
      }

      setStatus("saving");
      await addDoc(postsCol, {
        userId: user.uid,
        authorName: userDoc.fullName || user.displayName || "Citizen",
        authorPhotoURL: userDoc.photoURL ?? user.photoURL ?? null,
        authorPoints: userDoc.carePoints ?? 0,
        authorLevel: userDoc.level ?? 1,
        text: text.trim().slice(0, 2000),
        mediaType: mType,
        mediaUrl,
        commentCount: 0,
        createdAt: serverTimestamp(),
      });
      reset();
      setStatus("idle");
    } catch (e) {
      setErr((e as Error).message);
      setStatus("idle");
    }
  };

  return (
    <div className="rounded-2xl bg-surface-elevated border border-line p-4">
      <div className="flex gap-3">
        {userDoc?.photoURL ? (
          <img
            src={userDoc.photoURL}
            alt=""
            className="h-10 w-10 rounded-full object-cover bg-surface-subtle shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-surface-subtle grid place-items-center text-ink-secondary shrink-0">
            <User size={18} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="w-full h-11 px-4 rounded-full bg-surface-subtle text-left text-ink-secondary hover:bg-surface-base hover:border hover:border-line transition"
            >
              {t("post.compose.placeholder")}
            </button>
          ) : (
            <>
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("post.compose.placeholder")}
                rows={3}
                maxLength={2000}
                className="w-full p-3 rounded-xl bg-surface-base border border-line focus:border-brand outline-none text-base resize-none"
              />
              {preview && (
                <div className="rounded-xl overflow-hidden bg-black mt-3 relative">
                  {mediaType === "video" ? (
                    <video src={preview} controls playsInline className="w-full max-h-[260px]" />
                  ) : (
                    <img src={preview} alt="" className="w-full max-h-[260px] object-cover" />
                  )}
                  <button
                    onClick={() => setMedia(null)}
                    className="absolute top-2 right-2 h-9 w-9 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {status === "uploading" && (
                <div className="mt-3 h-1.5 rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    className="h-full bg-brand transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {err && <p className="text-sm text-danger mt-2">{err}</p>}

              <input
                ref={fileInput}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => setMedia(e.target.files?.[0] ?? null)}
              />

              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => fileInput.current?.click()}
                    aria-label={t("post.addMedia")}
                    className="h-9 w-9 grid place-items-center rounded-lg text-ink-secondary hover:bg-surface-subtle"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    onClick={() => fileInput.current?.click()}
                    aria-label={t("post.addMedia")}
                    className="h-9 w-9 grid place-items-center rounded-lg text-ink-secondary hover:bg-surface-subtle"
                  >
                    <Video size={18} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={reset}>
                    {t("post.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!text.trim() || status !== "idle"}
                    loading={status !== "idle"}
                    onClick={publish}
                  >
                    <Send size={16} />
                    {status === "idle" ? t("post.publish") : t("post.publishing")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
