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
  authenticity: number;
  aiProbability: number;
  coherence: number;
  likes: number;
  comments: number;
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

function readRaw(key: string): any {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignoramos errores de quota, etc.
  }
}

function normalizePost(p: any): DemoPost {
  const now = Date.now();
  return {
    id: typeof p?.id === 'string' ? p.id : `post_${now}_${Math.random().toString(16).slice(2)}`,
    imageUrl: typeof p?.imageUrl === 'string' ? p.imageUrl : '',
    score: typeof p?.score === 'number' ? p.score : 0,
    createdAt: typeof p?.createdAt === 'number' ? p.createdAt : now,
    authenticity: typeof p?.authenticity === 'number' ? p.authenticity : 70,
    aiProbability: typeof p?.aiProbability === 'number' ? p.aiProbability : 30,
    coherence: typeof p?.coherence === 'number' ? p.coherence : 75,
    likes: typeof p?.likes === 'number' ? p.likes : 0,
    comments: typeof p?.comments === 'number' ? p.comments : 0,
  };
}

/* POSTS */

export function loadDemoPosts(): DemoPost[] {
  const raw = readRaw(POSTS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => normalizePost(p));
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
    authenticity: analysis.authenticity,
    aiProbability: analysis.aiProbability,
    coherence: analysis.coherence,
    likes: 0,
    comments: 0,
  };

  const posts = loadDemoPosts();
  const updated = [post, ...posts];
  saveDemoPosts(updated);

  writeJSON(LAST_POST_KEY, post);

  return post;
}

export function loadLastPost(): DemoPost | null {
  const raw = readRaw(LAST_POST_KEY);
  if (!raw) return null;
  return normalizePost(raw);
}

export function toggleLike(postId: string): DemoPost[] {
  const posts = loadDemoPosts();
  const updated = posts.map((p) =>
    p.id === postId ? { ...p, likes: p.likes + 1 } : p
  );
  saveDemoPosts(updated);
  return updated;
}

export function incrementComments(postId: string): DemoPost[] {
  const posts = loadDemoPosts();
  const updated = posts.map((p) =>
    p.id === postId ? { ...p, comments: p.comments + 1 } : p
  );
  saveDemoPosts(updated);
  return updated;
}

/* NOTIFICACIONES */

export function loadNotifications(): DemoNotification[] {
  const raw = readRaw(NOTIFS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw as DemoNotification[];
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
