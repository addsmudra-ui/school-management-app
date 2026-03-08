"use client";

import { NewsPost, MOCK_NEWS, UserProfile, MOCK_USERS } from "./mock-data";

const STORAGE_KEY = 'mandalPulse_news_v2';
const LIKES_KEY = 'mandalPulse_liked_posts';
const USERS_KEY = 'mandalPulse_users_v1';

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

export const UserService = {
  getAll: (): UserProfile[] => {
    if (typeof window === 'undefined') return MOCK_USERS;
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) {
      localStorage.setItem(USERS_KEY, JSON.stringify(MOCK_USERS));
      return MOCK_USERS;
    }
    return JSON.parse(stored);
  },

  save: (users: UserProfile[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event('mandalPulse_usersChanged'));
  },

  add: (user: UserProfile) => {
    const users = UserService.getAll();
    // Check if user already exists by phone
    const exists = users.find(u => u.phone === user.phone);
    if (exists) return exists;
    
    const updated = [...users, user];
    UserService.save(updated);
    return user;
  },

  update: (id: string, updates: Partial<UserProfile>) => {
    const users = UserService.getAll();
    const updated = users.map(u => u.id === id ? { ...u, ...updates } : u);
    UserService.save(updated);
    
    // If the updated user is the current user, update localStorage auth
    const currentPhone = localStorage.getItem('mandalPulse_userPhone');
    const updatedUser = updated.find(u => u.id === id);
    if (updatedUser && updatedUser.phone === currentPhone) {
      localStorage.setItem('mandalPulse_userStatus', updatedUser.status);
      window.dispatchEvent(new Event('mandalPulse_authChanged'));
    }
  },

  getByPhone: (phone: string): UserProfile | undefined => {
    const users = UserService.getAll();
    return users.find(u => u.phone === phone);
  }
};
