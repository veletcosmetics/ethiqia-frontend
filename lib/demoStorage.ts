// lib/demoStorage.ts
export type AnalysisResult = {
  authenticity: number;
  aiProbability: number;
  coherence: number;
  ethScore: number;
};

export type DemoPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

export type DemoNotification = {
  id: string;
  type: 'score' | 'info' | 'error';
  message: string;
  createdAt: number;
  read: boolean;
};

const POSTS_KEY = 'ethiqia_demo_posts';
const LAST_POST_KEY = 'ethiqia_demo_last_post';
const NOTIFS_KEY = 'ethiqia_demo_notifications';

function isBrowser() {
  return typeof window !== 'undefined';
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/* POSTS */

export function loadDemoPosts(): DemoPost[] {
  return readJSON<DemoPost[]>(POSTS_KEY, []);
}

export function saveDemoPosts(posts: DemoPost[]) {
  writeJSON(POSTS_KEY, posts);
}

export function addDemoPost(
  imageUrl: string,
  analysis: AnalysisResult
): DemoPost {
  const now = Date.now();
  const post: DemoPost = {
    id: `post_${now}_${Math.random().toString(16).slice(2)}`,
    imageUrl,
    score: analysis.ethScore,
    createdAt: now,
  };

  const posts = loadDemoPosts();
  const updated = [post, ...posts];
  saveDemoPosts(updated);

  writeJSON(LAST_POST_KEY, post);
  return post;
}

export function loadLastPost(): DemoPost | null {
  return readJSON<DemoPost | null>(LAST_POST_KEY, null);
}

/* NOTIFICATIONS */

export function loadNotifications(): DemoNotification[] {
  return readJSON<DemoNotification[]>(NOTIFS_KEY, []);
}

export function saveNotifications(list: DemoNotification[]) {
  writeJSON(NOTIFS_KEY, list);
}

export function pushNotification(
  message: string,
  type: DemoNotification['type'] = 'info'
): DemoNotification {
  const notif: DemoNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type,
    message,
    createdAt: Date.now(),
    read: false,
  };

  const current = loadNotifications();
  const updated = [notif, ...current];
  saveNotifications(updated);

  return notif;
}

export function markNotificationAsRead(id: string) {
  const list = loadNotifications();
  const updated = list.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
}

export function clearAllNotifications() {
  saveNotifications([]);
}
