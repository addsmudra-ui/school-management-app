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

export function useCollection<T = any>(
  targetRefOrQuery:
    | CollectionReference<DocumentData>
    | Query<DocumentData>
    | null
    | undefined
): UseCollectionResult<T> {

  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {

    if (!targetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      targetRefOrQuery,

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

          const contextualError = new FirestorePermissionError({
            operation: "list",
            path: "unknown"
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

  }, [targetRefOrQuery]);

  return { data, isLoading, error };
}