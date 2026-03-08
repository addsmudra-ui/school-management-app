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
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Firestore,
  getDoc
} from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { NewsPost, UserProfile, Comment, DEFAULT_ADMIN_PASSWORD } from './mock-data';

export type SentNotification = {
  id: string;
  title: string;
  body: string;
  target: string;
  timestamp: any;
};

export const AdminService = {
  getPassword: async (db: Firestore): Promise<string> => {
    try {
      const docRef = doc(db, 'config', 'admin');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data().password || DEFAULT_ADMIN_PASSWORD;
      }
      return DEFAULT_ADMIN_PASSWORD;
    } catch (e) {
      return DEFAULT_ADMIN_PASSWORD;
    }
  },
  setPassword: (db: Firestore, newPassword: string) => {
    const configRef = doc(db, 'config', 'admin');
    setDocumentNonBlocking(configRef, { password: newPassword }, { merge: true });
  }
};

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

  update: (db: Firestore, postId: string, data: Partial<NewsPost>) => {
    const postRef = doc(db, 'pending_news_posts', postId);
    updateDocumentNonBlocking(postRef, data);
  },

  approve: (db: Firestore, postId: string, postData: NewsPost) => {
    const pendingRef = doc(db, 'pending_news_posts', postId);
    deleteDocumentNonBlocking(pendingRef);

    const approvedRef = doc(db, 'approved_news_posts', postId);
    setDocumentNonBlocking(approvedRef, {
      ...postData,
      status: 'approved',
      timestamp: serverTimestamp()
    }, { merge: true });

    NotificationService.send(db, {
      title: `బ్రేకింగ్: ${postData.title}`,
      body: `${postData.location.mandal} ప్రాంతంలో తాజా వార్తలు. ఇప్పుడే చదవండి!`,
      target: postData.location.district
    });
  },

  reject: (db: Firestore, postId: string) => {
    const postRef = doc(db, 'pending_news_posts', postId);
    updateDocumentNonBlocking(postRef, { status: 'rejected' });
  },

  delete: (db: Firestore, postId: string, isApproved: boolean) => {
    const path = isApproved ? 'approved_news_posts' : 'pending_news_posts';
    const postRef = doc(db, path, postId);
    deleteDocumentNonBlocking(postRef);
  },

  toggleLike: (db: Firestore, postId: string, userId: string, isCurrentlyLiked: boolean) => {
    const postRef = doc(db, 'approved_news_posts', postId);
    const userLikesRef = doc(db, 'users', userId, 'private', 'likes');
    
    if (isCurrentlyLiked) {
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
    
    const postRef = doc(db, 'approved_news_posts', postId);
    updateDocumentNonBlocking(postRef, { commentsCount: increment(1) });
  }
};

export const UserService = {
  getByPhone: async (db: Firestore, phone: string): Promise<UserProfile | null> => {
    try {
      const q = query(collection(db, 'users'), where('phone', '==', phone), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      return { ...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id } as UserProfile;
    } catch (e) {
      return null;
    }
  },

  create: async (db: Firestore, profile: UserProfile) => {
    const userRef = doc(db, 'users', profile.id);
    await setDoc(userRef, {
      ...profile,
      timestamp: serverTimestamp()
    }, { merge: true });

    const roleCollection = profile.role === 'admin' ? 'roles_admins' : 
                          profile.role === 'reporter' ? 'roles_reporters' : null;
    if (roleCollection) {
      const roleRef = doc(db, roleCollection, profile.id);
      await setDoc(roleRef, { active: true, updatedAt: serverTimestamp() }, { merge: true });
    }
  },

  update: (db: Firestore, userId: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', userId);
    updateDocumentNonBlocking(userRef, data);
  },

  delete: (db: Firestore, userId: string) => {
    const userRef = doc(db, 'users', userId);
    deleteDocumentNonBlocking(userRef);

    deleteDocumentNonBlocking(doc(db, 'roles_admins', userId));
    deleteDocumentNonBlocking(doc(db, 'roles_reporters', userId));
    deleteDocumentNonBlocking(doc(db, 'roles_editors', userId));
    deleteDocumentNonBlocking(doc(db, 'users', userId, 'private', 'likes'));
  }
};

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

export const LocationService = {
  addMandal: (db: Firestore, state: string, district: string, mandal: string) => {
    const locRef = doc(db, 'metadata', 'locations');
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