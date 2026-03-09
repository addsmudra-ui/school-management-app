'use client';

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Firestore,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { NewsPost, UserProfile, Comment, MOCK_NEWS, LOCATIONS_BY_STATE } from './mock-data';

export type SentNotification = {
  id: string;
  title: string;
  body: string;
  target: string;
  postId?: string;
  timestamp: any;
};

export const AdminService = {
  getPassword: async (db: Firestore): Promise<string> => {
    try {
      const docRef = doc(db, 'config', 'admin');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data().password || 'admin123'; 
      }
      return 'admin123';
    } catch (e) {
      return 'admin123';
    }
  },
  setPassword: (db: Firestore, newPassword: string) => {
    const configRef = doc(db, 'config', 'admin');
    setDocumentNonBlocking(configRef, { password: newPassword, updatedAt: serverTimestamp() }, { merge: true });
  },
  seedDemoNews: async (db: Firestore) => {
    const batch = writeBatch(db);
    
    // 1. Seed News Posts
    MOCK_NEWS.forEach((news) => {
      const docRef = doc(db, 'approved_news_posts', news.id);
      batch.set(docRef, {
        ...news,
        timestamp: serverTimestamp(),
      });
    });

    // 2. Seed Default Admin Config
    const adminRef = doc(db, 'config', 'admin');
    batch.set(adminRef, { password: 'admin123' }, { merge: true });

    // 3. Seed Locations Metadata
    const locRef = doc(db, 'metadata', 'locations');
    batch.set(locRef, {
      ...LOCATIONS_BY_STATE
    }, { merge: true });

    await batch.commit();
  }
};

export const NewsService = {
  add: (db: Firestore, post: Omit<NewsPost, 'id' | 'timestamp'>) => {
    const collectionName = post.status === 'approved' ? 'approved_news_posts' : 'pending_news_posts';
    const newsRef = collection(db, collectionName);
    const newDocRef = doc(newsRef);
    const postId = newDocRef.id;
    
    const data = {
      ...post,
      id: postId,
      timestamp: serverTimestamp(),
      likes: post.engagement?.likes || 0,
      commentsCount: post.engagement?.comments || 0,
    };
    
    setDocumentNonBlocking(newDocRef, data, { merge: true });

    if (post.status === 'approved') {
      NotificationService.send(db, {
        title: `బ్రేకింగ్: ${post.title}`,
        body: `${post.location.mandal} ప్రాంతంలో తాజా వార్తలు. ఇప్పుడే చూడండి!`,
        target: post.location.district,
        postId: postId
      });
    }

    return postId;
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
      body: `${postData.location.mandal} ప్రాంతంలో తాజా వార్తలు. ఇప్పుడే చూడండి!`,
      target: postData.location.district,
      postId: postId
    });
  },

  reject: (db: Firestore, postId: string) => {
    const postRef = doc(db, 'pending_news_posts', postId);
    updateDocumentNonBlocking(postRef, { status: 'rejected' });
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
  getById: async (db: Firestore, uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { ...snapshot.data(), id: snapshot.id } as UserProfile;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  getByPhone: async (db: Firestore, phone: string): Promise<UserProfile | null> => {
    try {
      const q = query(collection(db, 'users'), where('phone', '==', phone), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const data = querySnapshot.docs[0].data();
      return { ...data, id: querySnapshot.docs[0].id } as UserProfile;
    } catch (e) {
      return null;
    }
  },

  getByEmail: async (db: Firestore, email: string): Promise<UserProfile | null> => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const data = querySnapshot.docs[0].data();
      return { ...data, id: querySnapshot.docs[0].id } as UserProfile;
    } catch (e) {
      return null;
    }
  },

  create: async (db: Firestore, profile: UserProfile) => {
    const userRef = doc(db, 'users', profile.id);
    const cleanProfile = JSON.parse(JSON.stringify(profile));
    
    await setDoc(userRef, {
      ...cleanProfile,
      timestamp: serverTimestamp()
    }, { merge: true });

    const roleCollectionMap = {
      'admin': 'roles_admins',
      'reporter': 'roles_reporters',
      'editor': 'roles_editors',
      'user': null
    };

    const roleKey = profile.role as keyof typeof roleCollectionMap;
    const collectionName = roleCollectionMap[roleKey];
    if (collectionName) {
      const roleRef = doc(db, collectionName, profile.id);
      await setDoc(roleRef, { active: true, updatedAt: serverTimestamp() }, { merge: true });
    }
  },

  update: (db: Firestore, userId: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', userId);
    updateDocumentNonBlocking(userRef, data);
  },

  delete: (db: Firestore, userId: string) => {
    deleteDocumentNonBlocking(doc(db, 'users', userId));
    deleteDocumentNonBlocking(doc(db, 'roles_admins', userId));
    deleteDocumentNonBlocking(doc(db, 'roles_reporters', userId));
    deleteDocumentNonBlocking(doc(db, 'roles_editors', userId));
  }
};

export const NotificationService = {
  send: (db: Firestore, notification: { title: string; body: string; target: string; postId?: string }) => {
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
  addState: (db: Firestore, stateName: string) => {
    const locRef = doc(db, 'metadata', 'locations');
    setDocumentNonBlocking(locRef, {
      [stateName]: {}
    }, { merge: true });
  },
  addDistrict: (db: Firestore, state: string, district: string) => {
    const locRef = doc(db, 'metadata', 'locations');
    setDocumentNonBlocking(locRef, {
      [state]: {
        [district]: []
      }
    }, { merge: true });
  },
  addMandal: (db: Firestore, state: string, district: string, mandal: string) => {
    const locRef = doc(db, 'metadata', 'locations');
    setDocumentNonBlocking(locRef, {
      [state]: {
        [district]: arrayUnion(mandal)
      }
    }, { merge: true });
  }
};
