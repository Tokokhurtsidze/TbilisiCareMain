"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Send, Trash2, User } from "lucide-react";
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
import { DEMO_POSTS, DEMO_POST_COMMENTS } from "@/lib/demo-data";
import { PostEditor } from "@/components/PostEditor";
import { LEVELS, type Comment, type Post } from "@/types";

export default function PostDetailPage() {
  const { t, locale } = useI18n();
  const { user, userDoc } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = params.id;
  const isDemo = postId?.startsWith("demo-");

  const [post, setPost] = useState<Post | null>(null);
  const [liveComments, setLiveComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [editingPost, setEditingPost] = useState(false);

  useEffect(() => {
    if (!postId) return;
    if (isDemo) {
      const p = DEMO_POSTS.find((x) => x.id === postId) ?? null;
      setPost(p);
      return;
    }
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "posts", postId));
        if (snap.exists()) setPost({ id: snap.id, ...(snap.data() as object) } as Post);
      } catch (err) {
        console.error("[post] failed to load", err);
      }
    })();
  }, [postId, isDemo]);

  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db(), "posts", postId, "comments"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) =>
        setLiveComments(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Comment),
        ),
      () => setLiveComments([]),
    );
    return () => unsub();
  }, [postId]);

  const deletePost = async () => {
    if (!user || !post || isDemo) return;
    if (post.userId !== user.uid) return;
    if (!window.confirm(t("delete.confirmPost"))) return;
    setDeletingPost(true);
    try {
      await deleteDoc(doc(db(), "posts", post.id));
      router.replace("/app");
    } catch {
      alert(t("delete.failed"));
      setDeletingPost(false);
    }
  };

  const deleteComment = async (c: Comment) => {
    if (!user || !postId) return;
    if (c.userId !== user.uid) return;
    if (!window.confirm(t("delete.confirmComment"))) return;
    try {
      await deleteDoc(doc(db(), "posts", postId, "comments", c.id));
      if (!isDemo) {
        try {
          await updateDoc(doc(db(), "posts", postId), {
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
    if (!user || !userDoc || !text.trim() || !postId) return;
    setPosting(true);
    try {
      const trimmed = text.trim().slice(0, 500);
      await addDoc(collection(db(), "posts", postId, "comments"), {
        userId: user.uid,
        authorName: userDoc.fullName || user.displayName || "Citizen",
        authorPhotoURL: userDoc.photoURL ?? user.photoURL ?? null,
        text: trimmed,
        createdAt: serverTimestamp(),
      });
      if (!isDemo) {
        try {
          await updateDoc(doc(db(), "posts", postId), {
            commentCount: increment(1),
          });
        } catch {
          /* best-effort */
        }
      }
      setText("");
    } finally {
      setPosting(false);
    }
  };

  if (!post) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-ink-secondary">
        {t("common.loading")}
      </div>
    );
  }

  const levelKey =
    LEVELS.find((l) => l.level === post.authorLevel)?.key ?? "level.bystander";
  const seed = isDemo ? DEMO_POST_COMMENTS[postId] ?? [] : [];
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
        {t("post.back")}
      </Link>

      <article className="rounded-2xl bg-surface-elevated border border-line overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3">
          {post.authorPhotoURL ? (
            <img
              src={post.authorPhotoURL}
              alt=""
              className="h-10 w-10 rounded-full object-cover bg-surface-subtle"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-surface-subtle grid place-items-center text-ink-secondary">
              <User size={18} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{post.authorName}</p>
            <p className="text-xs text-ink-secondary">
              {t(levelKey)} · {post.authorPoints} {t("home.points")}
            </p>
          </div>
          <time className="text-xs text-ink-secondary whitespace-nowrap">
            {relativeTime(toMs(post.createdAt), locale)}
            {post.editedAt ? ` · ${t("post.edit.edited")}` : ""}
          </time>
          {!isDemo && user?.uid === post.userId && !editingPost && (
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => setEditingPost(true)}
                aria-label={t("common.edit")}
                title={t("common.edit")}
                className="h-9 w-9 grid place-items-center rounded-lg text-ink-secondary hover:bg-brand-soft hover:text-brand"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={deletePost}
                disabled={deletingPost}
                aria-label={t("common.delete")}
                title={t("common.delete")}
                className="h-9 w-9 grid place-items-center rounded-lg text-ink-secondary hover:bg-danger/10 hover:text-danger disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </header>

        {editingPost ? (
          <div className="px-4 pb-4">
            <PostEditor post={post} onDone={() => setEditingPost(false)} />
          </div>
        ) : (
          <>
            {post.text && (
              <p className="px-4 pb-3 text-[15px] whitespace-pre-wrap">
                {post.text}
              </p>
            )}

            {post.mediaUrl &&
              (post.mediaType === "video" ? (
                <video
                  src={post.mediaUrl}
                  controls
                  playsInline
                  className="w-full max-h-[520px] bg-black"
                />
              ) : (
                <img
                  src={post.mediaUrl}
                  alt=""
                  className="w-full max-h-[520px] object-cover bg-black"
                />
              ))}
          </>
        )}
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
