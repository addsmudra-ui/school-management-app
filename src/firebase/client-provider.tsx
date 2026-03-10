'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    const { auth } = firebaseServices;
    
    // Ensure every visitor has an active session (even if anonymous)
    // to satisfy security rules that require isSignedIn().
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          // Gracefully handle cases where anonymous auth is restricted or disabled in the console.
          if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
            console.warn("Anonymous authentication is not enabled or is restricted in the Firebase Console. Some features may require explicit sign-in.");
          } else {
            console.error("Failed to sign in anonymously:", error);
          }
        });
      }
    });

    return () => unsubscribe();
  }, [firebaseServices]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
