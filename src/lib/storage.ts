
'use client';

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Firestore
} from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { NewsPost, UserProfile, Comment } from './mock-data';

/**
 * Service for administrative configurations.
 * In a real Firebase app, this might be a 'config' document or custom claims.
 * For this prototype, we'll use a single document in a 'config' collection.
 */
export const AdminService = {
  getPassword: async (db: Firestore): Promise<string> => {
    // In a real app, you wouldn't store passwords in Firestore like this.
    // This is for demonstration of the requested "admin password" feature.
    return 'admin123'; 
  },
  setPassword: (db: Firestore, newPassword: string) => {
    const configRef = doc(db, 'config', 'admin');
    setDocumentNonBlocking(configRef, { password: newPassword }, { merge: true });
  }
};

/**
 * Service for News Management using Firestore.
 */
export const NewsService = {
  add: (db: Firestore, post: Omit<NewsPost, 'id' | 'timestamp'>) => {
    const newsRef = collection(db, 'pending_news_posts');
    const newDocRef = doc(newsRef);
    const data = {
      ...post,
      id: newDocRef.id,
      timestamp: serverTimestamp(),
      likes: 0,
      commentsCount: 0,
    };
    setDocumentNonBlocking(newDocRef, data, { merge: true });
    return newDocRef.id;
  },

  approve: (db: Firestore, postId: string, postData: NewsPost) => {
    // 1. Delete from pending
    const pendingRef = doc(db, 'pending_news_posts', postId);
    deleteDocumentNonBlocking(pendingRef);

    // 2. Add to approved
    const approvedRef = doc(db, 'approved_news_posts', postId);
    setDocumentNonBlocking(approvedRef, {
      ...postData,
      status: 'approved',
      timestamp: serverTimestamp()
    }, { merge: true });

    // 3. Trigger Notification
    NotificationService.send(db, {
      title: `బ్రేకింగ్: ${postData.title}`,
      body: `${postData.location.mandal} ప్రాంతంలో తాజా వార్తలు. ఇప్పుడే చదవండి!`,
      target: postData.location.district
    });
  },

  reject: (db: Firestore, postId: string) => {
    const pendingRef = doc(db, 'pending_news_posts', postId);
    updateDocumentNonBlocking(pendingRef, { status: 'rejected' });
  },

  delete: (db: Firestore, postId: string, isApproved: boolean) => {
    const path = isApproved ? 'approved_news_posts' : 'pending_news_posts';
    const postRef = doc(db, path, postId);
    deleteDocumentNonBlocking(postRef);
  },

  toggleLike: (db: Firestore, postId: string, userId: string, isLiked: boolean) => {
    const postRef = doc(db, 'approved_news_posts', postId);
    const userLikesRef = doc(db, 'users', userId, 'private', 'likes');
    
    if (isLiked) {
      updateDocumentNonBlocking(postRef, { likes: increment(-1) });
      updateDocumentNonBlocking(userLikesRef, { postIds: arrayRemove(postId) });
    } else {
      updateDocumentNonBlocking(postRef, { likes: increment(1) });
      setDocumentNonBlocking(userLikesRef, { postIds: arrayUnion(postId) }, { merge: true });
    }
  },

  addComment: (db: Firestore, postId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => {
    const commentsRef = collection(db, 'approved_news_posts', postId, 'comments');
    const commentDoc = doc(commentsRef);
    const commentData = {
      ...comment,
      id: commentDoc.id,
      timestamp: serverTimestamp()
    };
    setDocumentNonBlocking(commentDoc, commentData, { merge: true });
    
    // Update count on post
    const postRef = doc(db, 'approved_news_posts', postId);
    updateDocumentNonBlocking(postRef, { commentsCount: increment(1) });
  }
};

/**
 * Service for User Profiles using Firestore.
 */
export const UserService = {
  create: (db: Firestore, profile: UserProfile) => {
    const userRef = doc(db, 'users', profile.id);
    setDocumentNonBlocking(userRef, {
      ...profile,
      timestamp: serverTimestamp()
    }, { merge: true });

    // Handle role shadow collections for RBAC
    const roleCollection = profile.role === 'admin' ? 'roles_admins' : 
                          profile.role === 'reporter' ? 'roles_reporters' : null;
    if (roleCollection) {
      const roleRef = doc(db, roleCollection, profile.id);
      setDocumentNonBlocking(roleRef, { active: true }, { merge: true });
    }
  },

  updateStatus: (db: Firestore, userId: string, status: 'approved' | 'pending' | 'rejected') => {
    const userRef = doc(db, 'users', userId);
    updateDocumentNonBlocking(userRef, { status });
  }
};

/**
 * Service for Notifications using Firestore.
 */
export const NotificationService = {
  send: (db: Firestore, notification: { title: string; body: string; target: string }) => {
    const notifRef = collection(db, 'notifications');
    const newNotif = doc(notifRef);
    setDocumentNonBlocking(newNotif, {
      ...notification,
      id: newNotif.id,
      timestamp: serverTimestamp()
    }, { merge: true });
  }
};

/**
 * Service for Locations using Firestore.
 */
export const LocationService = {
  addMandal: (db: Firestore, state: string, district: string, mandal: string) => {
    const locRef = doc(db, 'metadata', 'locations');
    // Using nested objects in metadata to avoid flat structure issues
    updateDocumentNonBlocking(locRef, {
      [`${state}.${district}`]: arrayUnion(mandal)
    });
  },
  addDistrict: (db: Firestore, state: string, district: string) => {
    const locRef = doc(db, 'metadata', 'locations');
    updateDocumentNonBlocking(locRef, {
      [`${state}.${district}`]: []
    });
  }
};
