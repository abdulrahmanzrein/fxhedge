"use client";
import { useCallback, useEffect, useState } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const KEY = "halalflow:chats";
const MAX_CHATS = 60;

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** First question becomes the title — what the user will scan for later. */
export function titleFrom(question: string): string {
  const t = question.trim().replace(/\s+/g, " ");
  return t.length > 60 ? `${t.slice(0, 57)}…` : t || "New conversation";
}

/** Day buckets for the history rail, newest first. */
export function groupByDay(chats: Conversation[]): { label: string; items: Conversation[] }[] {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(new Date());
  const day = 86_400_000;

  const buckets = new Map<string, Conversation[]>();
  const order: string[] = [];

  for (const c of [...chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    const when = startOfDay(new Date(c.updatedAt));
    const diff = Math.round((today - when) / day);

    let label: string;
    if (diff <= 0) label = "Today";
    else if (diff === 1) label = "Yesterday";
    else if (diff < 7) label = "Previous 7 days";
    else if (diff < 30) label = "Previous 30 days";
    else {
      label = new Date(c.updatedAt).toLocaleDateString("en-CA", {
        month: "long",
        year: "numeric",
      });
    }

    if (!buckets.has(label)) {
      buckets.set(label, []);
      order.push(label);
    }
    buckets.get(label)!.push(c);
  }

  return order.map((label) => ({ label, items: buckets.get(label)! }));
}

export function useChats() {
  const [chats, setChats] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setChats(JSON.parse(raw) as Conversation[]);
    } catch {
      // corrupt storage — start clean rather than crash the page
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Conversation[]) => {
    setChats(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX_CHATS)));
    } catch {
      // over quota — history stays in memory for this session
    }
  }, []);

  const active = chats.find((c) => c.id === activeId) ?? null;

  /** Starts a conversation and returns its id so the caller can append to it. */
  const startChat = useCallback(
    (question: string): string => {
      const id = newId();
      const now = new Date().toISOString();
      const chat: Conversation = {
        id,
        title: titleFrom(question),
        messages: [{ role: "user", text: question }],
        createdAt: now,
        updatedAt: now,
      };
      setActiveId(id);
      setChats((prev) => {
        const next = [chat, ...prev].slice(0, MAX_CHATS);
        try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
        return next;
      });
      return id;
    },
    [],
  );

  const appendTo = useCallback((id: string, message: ChatMessage) => {
    setChats((prev) => {
      const next = prev.map((c) =>
        c.id === id
          ? { ...c, messages: [...c.messages, message], updatedAt: new Date().toISOString() }
          : c,
      );
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeChat = useCallback(
    (id: string) => {
      setActiveId((cur) => (cur === id ? null : cur));
      setChats((prev) => {
        const next = prev.filter((c) => c.id !== id);
        try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [],
  );

  const clearAll = useCallback(() => {
    setActiveId(null);
    persist([]);
  }, [persist]);

  return {
    chats,
    active,
    activeId,
    ready,
    setActiveId,
    startChat,
    appendTo,
    removeChat,
    clearAll,
  };
}
