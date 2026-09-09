"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CircleAlert, CircleCheck, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NOTIFICATIONS_REFRESH_EVENT } from "@/lib/notifications/client";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30_000;

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setItems(data.notifications);
        setUnread(data.unreadCount);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    const interval = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    const onRefresh = () => void load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };

    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  useEffect(() => {
    if (open) void load(true);
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setUnread(0);
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
  }

  async function markRead(item: NotificationItem) {
    if (item.isRead) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    setUnread((count) => Math.max(0, count - 1));
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, isRead: true } : entry,
      ),
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative h-10 w-10 rounded-xl p-0"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5 text-slate-600" aria-hidden="true" />
        {unread ? (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
        ) : null}
      </Button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-2xl shadow-primary-950/10">
          <div className="flex items-center justify-between border-b border-primary-100 px-4 py-3.5">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unread ? (
              <button
                type="button"
                className="text-xs font-medium text-primary-700 hover:underline"
                onClick={markAllRead}
              >
                Mark all read
              </button>
            ) : (
              <span className="text-xs text-slate-500">All clear</span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && !items.length ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Loading…
              </p>
            ) : items.length ? (
              items.map((item) => {
                const Icon =
                  item.type === "success"
                    ? CircleCheck
                    : item.type === "warning" || item.type === "error"
                      ? CircleAlert
                      : Info;
                const content = (
                  <div
                    className={`flex gap-3 px-4 py-3.5 ${item.isRead ? "bg-white" : "bg-primary-50/60"}`}
                  >
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary-700"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600">
                        {item.message}
                      </p>
                      <time className="mt-1 block text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString("en-IN")}
                      </time>
                    </div>
                  </div>
                );
                return item.link ? (
                  <Link
                    key={item.id}
                    href={item.link}
                    onClick={() => {
                      void markRead(item);
                      setOpen(false);
                    }}
                    className="block border-b border-slate-100 last:border-0"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => void markRead(item)}
                    className="block w-full border-b border-slate-100 text-left last:border-0"
                  >
                    {content}
                  </button>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  You&rsquo;re all caught up
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  New activity will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
