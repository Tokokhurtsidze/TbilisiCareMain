"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, Pencil, Trash2, User } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { toMs, relativeTime } from "@/lib/utils";
import { PostEditor } from "@/components/PostEditor";
import { LEVELS, type Post } from "@/types";

export function PostCard({ post }: { post: Post }) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner =
    !!user && user.uid === post.userId && !post.id.startsWith("demo-");

  const levelKey =
    LEVELS.find((l) => l.level === post.authorLevel)?.key ?? "level.bystander";

  const handleDelete = async () => {
    if (!isOwner) return;
    if (!window.confirm(t("delete.confirmPost"))) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db(), "posts", post.id));
    } catch {
      alert(t("delete.failed"));
      setDeleting(false);
    }
  };

  return (
    <article className="rounded-2xl bg-surface-elevated border border-line overflow-hidden card-hover">
      <header className="flex items-center gap-3 px-4 py-3.5">
        {post.authorPhotoURL ? (
          <img
            src={post.authorPhotoURL}
            alt=""
            className="h-10 w-10 rounded-full object-cover bg-surface-subtle ring-2 ring-surface-base"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-brand-soft grid place-items-center text-brand ring-2 ring-surface-base">
            <User size={17} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate leading-tight">{post.authorName}</p>
          <p className="text-xs text-ink-secondary mt-0.5">
            {t(levelKey)} · <span className="font-medium text-brand">{post.authorPoints.toLocaleString()}</span> {t("home.points")}
          </p>
        </div>
        <time className="text-xs text-ink-secondary whitespace-nowrap shrink-0">
          {relativeTime(toMs(post.createdAt), locale)}
          {post.editedAt ? ` · ${t("post.edit.edited")}` : ""}
        </time>
        {isOwner && !editing && (
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={() => setEditing(true)}
              aria-label={t("common.edit")}
              title={t("common.edit")}
              className="h-9 w-9 grid place-items-center rounded-lg text-ink-secondary hover:bg-brand-soft hover:text-brand"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label={t("common.delete")}
              title={t("common.delete")}
              className="h-9 w-9 grid place-items-center rounded-lg text-ink-secondary hover:bg-danger/10 hover:text-danger disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </header>

      {editing ? (
        <div className="px-4 pb-4">
          <PostEditor post={post} onDone={() => setEditing(false)} />
        </div>
      ) : (
        <>
          {post.text && (
            <p className="px-4 pb-3 text-[15px] text-ink-primary whitespace-pre-wrap">
              {post.text}
            </p>
          )}

          {post.mediaUrl && (
            <Link href={`/app/post/${post.id}`} className="block bg-black">
              {post.mediaType === "video" ? (
                <video
                  src={post.mediaUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full max-h-[460px] bg-black"
                />
              ) : (
                <img
                  src={post.mediaUrl}
                  alt=""
                  className="w-full max-h-[460px] object-cover bg-black"
                  loading="lazy"
                />
              )}
            </Link>
          )}

          <div className="px-4 py-3 flex items-center justify-end border-t border-line/60">
            <Link
              href={`/app/post/${post.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-brand transition-colors font-medium"
            >
              <MessageCircle size={14} />
              {post.commentCount === 1
                ? t("deed.comment.one")
                : t("deed.comments", { n: post.commentCount ?? 0 })}
            </Link>
          </div>
        </>
      )}
    </article>
  );
}
