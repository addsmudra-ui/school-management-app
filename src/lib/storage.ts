"use client";

import { NewsPost, MOCK_NEWS, UserProfile, MOCK_USERS, LOCATIONS_BY_STATE } from "./mock-data";

const STORAGE_KEY = 'mandalPulse_news_v2';
const LIKES_KEY = 'mandalPulse_liked_posts';
const USERS_KEY = 'mandalPulse_users_v1';
const LOCATIONS_KEY = 'mandalPulse_locations_v1';
const NOTIFICATIONS_KEY = 'mandalPulse_notifications_v1';

export type SentNotification = {
  id: string;
  title: string;
  body: string;
  target: string;
  timestamp: string;
};

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

export const LocationService = {
  getLocations: (): Record<string, Record<string, string[]>> => {
    if (typeof window === 'undefined') return LOCATIONS_BY_STATE;
    const stored = localStorage.getItem(LOCATIONS_KEY);
    if (!stored) {
      localStorage.setItem(LOCATIONS_KEY, JSON.stringify(LOCATIONS_BY_STATE));
      return LOCATIONS_BY_STATE;
    }
    return JSON.parse(stored);
  },

  save: (locations: Record<string, Record<string, string[]>>) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
    window.dispatchEvent(new Event('mandalPulse_locationsChanged'));
  },

  addMandal: (state: string, district: string, mandal: string) => {
    const locs = LocationService.getLocations();
    if (!locs[state]) locs[state] = {};
    if (!locs[state][district]) locs[state][district] = [];
    
    if (!locs[state][district].includes(mandal)) {
      locs[state][district].push(mandal);
      LocationService.save(locs);
    }
  },

  addDistrict: (state: string, district: string) => {
    const locs = LocationService.getLocations();
    if (!locs[state]) locs[state] = {};
    if (!locs[state][district]) {
      locs[state][district] = [];
      LocationService.save(locs);
    }
  }
};

export const NotificationService = {
  getAll: (): SentNotification[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  send: (notification: Omit<SentNotification, 'id' | 'timestamp'>) => {
    const history = NotificationService.getAll();
    const newNotif: SentNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    const updated = [newNotif, ...history];
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('mandalPulse_notificationsChanged'));
    return newNotif;
  }
};
