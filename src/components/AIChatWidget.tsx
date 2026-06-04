"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AIChatWidget() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: t("ai.welcome") }]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setError(null);

    setMessages([...history, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          locale,
        }),
      });

      if (!res.ok) throw new Error("upstream");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const json = JSON.parse(payload);
            const delta: string = json.choices?.[0]?.delta?.content ?? "";
            accumulated += delta;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                role: "assistant",
                content: accumulated,
              };
              return next;
            });
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch {
      setError(t("ai.error"));
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("ai.button_label")}
        className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6 flex items-center gap-2 bg-brand text-white rounded-full shadow-lg px-4 py-3 hover:opacity-90 transition-opacity"
      >
        <MessageCircle size={20} />
        <span className="text-sm font-medium hidden sm:inline">
          {t("ai.button_label")}
        </span>
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-36 right-4 z-50 md:bottom-20 md:right-6 w-[calc(100vw-2rem)] max-w-sm bg-surface-base border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand text-white shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="font-semibold text-sm">{t("ai.title")}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("ai.close")}
              className="hover:opacity-70 transition-opacity"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-surface-subtle text-ink-primary rounded-bl-sm"
                  }`}
                >
                  {msg.content ||
                    (loading && i === messages.length - 1 ? (
                      <span className="flex items-center gap-1 text-ink-secondary">
                        <Loader2 size={14} className="animate-spin" />
                        {t("ai.thinking")}
                      </span>
                    ) : null)}
                </div>
              </div>
            ))}
            {error && (
              <p className="text-center text-xs text-red-500">{error}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={send}
            className="flex items-center gap-2 px-3 py-3 border-t border-line shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              disabled={loading}
              className="flex-1 bg-surface-subtle text-ink-primary placeholder:text-ink-secondary text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={t("ai.send")}
              className="shrink-0 bg-brand text-white rounded-full p-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
