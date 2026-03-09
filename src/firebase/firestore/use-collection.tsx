'use client'

import { useEffect, useState } from "react";
import {
  Query,
  CollectionReference,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  FirestoreError
} from "firebase/firestore";

import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery:
    | CollectionReference<DocumentData>
    | Query<DocumentData>
    | null
    | undefined
): UseCollectionResult<T> {

  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs: WithId<T>[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));

        setData(docs);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        if (err.code === "permission-denied") {
          // Attempt to extract the path for better debugging context
          let path = "unknown";
          try {
             if ('path' in memoizedTargetRefOrQuery) {
               path = (memoizedTargetRefOrQuery as CollectionReference).path;
             } else if ((memoizedTargetRefOrQuery as any)._query?.path?.canonicalString) {
               path = (memoizedTargetRefOrQuery as any)._query.path.canonicalString();
             }
          } catch (e) {
            path = "error-resolving-path";
          }

          const contextualError = new FirestorePermissionError({
            operation: "list",
            path: path
          });

          errorEmitter.emit("permission-error", contextualError);
          setError(contextualError);
        } else {
          setError(err);
        }

        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}