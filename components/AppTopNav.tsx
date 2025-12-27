"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

type NotificationPayload = {
  title?: string;
  body?: string;
  points_awarded?: number;
  points_delta?: number;
  post_id?: string;
  event_id?: string;
  [k: string]: any;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  payload: NotificationPayload | null;
  read_at: string | null;
  created_at: string;
};

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 17H9m10-2.5V11a7 7 0 10-14 0v3.5L3 17h18l-2-2.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 20a2 2 0 004 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 115.3-12.8A7.5 7.5 0 0110.5 18z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.8 16.8L21 21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AppTopNav() {
  const pathname = usePathname();

  // Ocultar en landing (/) y /investors
  const hidden = useMemo(() => {
    if (!pathname) return false;
    return pathname === "/" || pathname.startsWith("/investors");
  }, [pathname]);

  const [authed, setAuthed] = useState(false);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState<number>(0);

  const panelRef = useRef<HTMLDivElement | null>(null);

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setItems([]);
        setUnread(0);
        setAuthed(false);
        return;
      }
      setAuthed(true);

      const res = await fetch("/api/notifications?limit=30", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("TopNav notifications error:", json);
        setItems([]);
        setUnread(0);
        return;
      }

      const list = (json.notifications ?? []) as NotificationRow[];
      setItems(list);
      setUnread(list.filter((n) => !n.read_at).length);
    } finally {
      setLoading(false);
    }
  };

  const markOneRead = async (id: string) => {
    const token = await getAccessToken();
    if (!token) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    await loadNotifications();
  };

  const markAllRead = async () => {
    const token = await getAccessToken();
    if (!token) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ markAllRead: true }),
    });
    await loadNotifications();
  };

  // Cargar contador al entrar + refresco moderado
  useEffect(() => {
    if (hidden) return;

    loadNotifications();

    const onVis = () => {
      if (document.visibilityState === "visible") loadNotifications();
    };
    document.addEventListener("visibilitychange", onVis);

    const t = window.setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
