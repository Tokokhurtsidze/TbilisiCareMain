"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, Award, Trash2 } from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toMs, relativeTime } from "@/lib/utils";
import { DEMO_DEEDS, DEMO_COMMENTS } from "@/lib/demo-data";
import { LEVELS, type Comment, type Deed } from "@/types";

export default function DeedDetailPage() {
  const { t, locale } = useI18n();
  const { user, userDoc } = useAuth();
  const params = useParams<{ id: string }>();
  const deedId = params.id;
  const isDemo = deedId?.startsWith("demo-");

  const [deed, setDeed] = useState<Deed | null>(null);
  const [liveComments, setLiveComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!deedId) return;
    if (isDemo) {
      const d = DEMO_DEEDS.find((x) => x.id === deedId) ?? null;
      setDeed(d);
      return;
    }
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "deeds", deedId));
        if (snap.exists()) setDeed({ id: snap.id, ...(snap.data() as object) } as Deed);
      } catch (err) {
        console.error("[deed] failed to load", err);
      }
    })();
  }, [deedId, isDemo]);

  // Subscribe to Firestore comments for ALL deeds — including demo ones.
  // Demo deeds use the same `deeds/{id}/comments` subcollection so user comments
  // are visible across accounts. Seed comments live in DEMO_COMMENTS and are
  // merged in for display.
  useEffect(() => {
    if (!deedId) return;
    const q = query(
      collection(db(), "deeds", deedId, "comments"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLiveComments(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Comment),
        );
      },
      () => setLiveComments([]),
    );
    return () => unsub();
  }, [deedId]);

  const deleteComment = async (c: Comment) => {
    if (!user || !deedId) return;
    if (c.userId !== user.uid) return;
    if (!window.confirm(t("delete.confirmComment"))) return;
    try {
      await deleteDoc(doc(db(), "deeds", deedId, "comments", c.id));
      if (!isDemo) {
        try {
          await updateDoc(doc(db(), "deeds", deedId), {
            commentCount: increment(-1),
          });
        } catch {
          /* best-effort */
        }
      }
    } catch {
      alert(t("delete.failed"));
    }
  };

  const submitComment = async () => {
    if (!user || !userDoc || !text.trim() || !deedId) return;
    setPosting(true);
    try {
      const trimmed = text.trim().slice(0, 500);
      await addDoc(collection(db(), "deeds", deedId, "comments"), {
        userId: user.uid,
        authorName: userDoc.fullName || user.displayName || "Citizen",
        authorPhotoURL: userDoc.photoURL ?? user.photoURL ?? null,
        text: trimmed,
        createdAt: serverTimestamp(),
      });
      // Only real deeds have a parent doc to bump.
      if (!isDemo) {
        try {
          await updateDoc(doc(db(), "deeds", deedId), {
            commentCount: increment(1),
          });
        } catch {
          // Best-effort; production: Cloud Function trigger.
        }
      }
      setText("");
    } finally {
      setPosting(false);
    }
  };

  if (!deed) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-ink-secondary">
        {t("common.loading")}
      </div>
    );
  }

  const levelKey =
    LEVELS.find((l) => l.level === deed.authorLevel)?.key ?? "level.bystander";
  const seed = isDemo ? DEMO_COMMENTS[deedId] ?? [] : [];
  const allComments = [...seed, ...liveComments].sort(
    (a, b) => toMs(a.createdAt) - toMs(b.createdAt),
  );

  return (
    <div className="space-y-5">
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-brand"
      >
        <ArrowLeft size={16} />
        {t("deed.back")}
      </Link>

      <article className="rounded-2xl bg-surface-elevated border border-line overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3">
          {deed.authorPhotoURL ? (
            <img
              src={deed.authorPhotoURL}
              alt=""
              className="h-10 w-10 rounded-full object-cover bg-surface-subtle"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-surface-subtle grid place-items-center font-semibold">
              {deed.authorName?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{deed.authorName}</p>
            <p className="text-xs text-ink-secondary">
              {t(levelKey)} · {deed.authorPoints} {t("home.points")}
            </p>
          </div>
          <time className="text-xs text-ink-secondary">
            {relativeTime(toMs(deed.createdAt), locale)}
          </time>
        </header>

        {deed.caption && (
          <p className="px-4 pb-2 text-sm whitespace-pre-wrap">{deed.caption}</p>
        )}

        {deed.proofUrl ? (
          deed.proofType === "video" ? (
            <video
              src={deed.proofUrl}
              controls
              playsInline
              className="w-full max-h-[520px] bg-black"
            />
          ) : (
            <img
              src={deed.proofUrl}
              alt=""
              className="w-full max-h-[520px] object-cover bg-black"
            />
          )
        ) : (
          <div className="bg-gradient-to-br from-brand-soft to-surface-elevated p-10 text-center">
            <Award size={48} className="text-brand mx-auto mb-2" />
            <p className="text-sm text-ink-secondary">{t("submit.noProof")}</p>
          </div>
        )}

        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand bg-brand-soft px-2.5 py-1 rounded-full">
            <Award size={14} />
            {t(`task.${deed.taskTypeId}`)}
          </span>
          <span className="text-sm font-semibold text-success">
            {t("deed.points", { n: deed.pointsAwarded })}
          </span>
        </div>
      </article>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("comments.title")}</h2>

        {allComments.length === 0 ? (
          <Card className="mb-3">
            <p className="text-sm text-ink-secondary text-center">
              {t("comments.empty")}
            </p>
          </Card>
        ) : (
          <ul className="space-y-2 mb-3">
            {allComments.map((c) => {
              const canDelete = !!user && c.userId === user.uid;
              return (
                <li
                  key={c.id}
                  className="rounded-xl bg-surface-elevated border border-line px-4 py-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {c.authorPhotoURL ? (
                      <img
                        src={c.authorPhotoURL}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover bg-surface-subtle"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-surface-subtle" />
                    )}
                    <span className="text-sm font-medium">{c.authorName}</span>
                    <span className="text-xs text-ink-secondary ml-auto">
                      {relativeTime(toMs(c.createdAt), locale)}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => deleteComment(c)}
                        aria-label={t("common.delete")}
                        title={t("common.delete")}
                        className="h-7 w-7 grid place-items-center rounded text-ink-secondary hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-ink-primary whitespace-pre-wrap">
                    {c.text}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitComment();
              }
            }}
            placeholder={t("comments.placeholder")}
            maxLength={500}
            className="flex-1 h-12 px-4 rounded-xl bg-surface-elevated border border-line focus:border-brand outline-none text-base"
          />
          <Button
            onClick={submitComment}
            disabled={!text.trim()}
            loading={posting}
            aria-label={t("comments.send")}
          >
            <Send size={18} />
          </Button>
        </div>
      </section>
    </div>
  );
}
