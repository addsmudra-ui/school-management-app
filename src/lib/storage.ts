
"use client";

import { NewsPost, MOCK_NEWS } from "./mock-data";

const STORAGE_KEY = 'mandalPulse_news_v1';
const LIKES_KEY = 'mandalPulse_liked_posts';

export const NewsService = {
  getAll: (): NewsPost[] => {
    if (typeof window === 'undefined') return MOCK_NEWS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_NEWS));
      return MOCK_NEWS;
    }
    return JSON.parse(stored);
  },

  save: (news: NewsPost[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
    window.dispatchEvent(new Event('mandalPulse_newsChanged'));
  },

  add: (post: NewsPost) => {
    const news = NewsService.getAll();
    const updated = [post, ...news];
    NewsService.save(updated);
  },

  update: (id: string, updates: Partial<NewsPost>) => {
    const news = NewsService.getAll();
    const updated = news.map(n => n.id === id ? { ...n, ...updates } : n);
    NewsService.save(updated);
  },

  delete: (id: string) => {
    const news = NewsService.getAll();
    const updated = news.filter(n => n.id !== id);
    NewsService.save(updated);
  },

  getLikedPostIds: (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(LIKES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  toggleLike: (postId: string) => {
    if (typeof window === 'undefined') return false;
    const liked = NewsService.getLikedPostIds();
    const isLiked = liked.includes(postId);
    const updated = isLiked 
      ? liked.filter(id => id !== postId)
      : [...liked, postId];
    
    localStorage.setItem(LIKES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('mandalPulse_likesChanged'));
    return !isLiked;
  }
};
