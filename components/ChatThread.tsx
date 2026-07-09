"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "@/lib/types";
import MessageBubble from "./MessageBubble";

const STORAGE_KEY = "lca_chat_history";
const MAX_STORED_MESSAGES = 40;

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function ChatThread() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const next = [...messages, { role: "user" as const, text: trimmed }];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-MAX_STORED_MESSAGES) }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setMessages((current) => [
        ...current,
        { role: "model", text: data.reply as string, uiCards: data.uiCards },
      ]);
    } catch {
      setError("Couldn't reach the assistant — check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-neutral-500">
            Ask about a school, or tell me about a session you just ran.
          </p>
        )}
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 pb-2 text-center text-sm text-red-500">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Message the assistant…"
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={sending || input.trim().length === 0}
          className="rounded-full bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
