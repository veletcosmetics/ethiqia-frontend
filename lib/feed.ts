// lib/feed.ts

const FEED_KEY = 'ethiqia_demo_feed_v2';

export type DemoFeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

export function getDemoFeedPosts(): DemoFeedPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FEED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoFeedPost[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function addDemoFeedPost(post: DemoFeedPost) {
  if (typeof window === 'undefined') return;
  const current = getDemoFeedPosts();
  const updated = [post, ...current];
  window.localStorage.setItem(FEED_KEY, JSON.stringify(updated));
}

export function deleteDemoFeedPost(id: string) {
  if (typeof window === 'undefined') return;
  const current = getDemoFeedPosts();
  const updated = current.filter((p) => p.id !== id);
  window.localStorage.setItem(FEED_KEY, JSON.stringify(updated));
}
