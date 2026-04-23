import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface SessionMetadata {
  timerStatus: 'idle' | 'running' | 'paused' | 'ended';
  timerStartTime: number | null; // Unix timestamp
  timerDuration: number; // in seconds
  liveReport: string;
  isArchived: boolean;
  expertUid: string;
}

export function useSessionMetadata(sessionId: string, expertUid?: string) {
  const [metadata, setMetadata] = useState<SessionMetadata>({
    timerStatus: 'idle',
    timerStartTime: null,
    timerDuration: 3600, // 60 mins default
    liveReport: '',
    isArchived: false,
    expertUid: expertUid || ''
  });

  useEffect(() => {
    if (!sessionId) return;

    const docRef = doc(db, 'sessions', sessionId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().metadata as SessionMetadata;
        if (data) {
          setMetadata(prev => ({ ...prev, ...data }));
        }
      } else {
        // Initialize if not exists
        if (expertUid) {
          setDoc(docRef, {
            metadata: {
              timerStatus: 'idle',
              timerDuration: 3600,
              liveReport: '',
              isArchived: false,
              expertUid
            },
            createdAt: serverTimestamp()
          }).catch(console.error);
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId, expertUid]);

  const updateMetadata = async (patch: Partial<SessionMetadata>) => {
    if (!sessionId) return;
    const docRef = doc(db, 'sessions', sessionId);
    try {
      await updateDoc(docRef, {
        [`metadata.${Object.keys(patch)[0]}`]: Object.values(patch)[0],
        // If we have more than one field to patch, we should construct the object
        ...Object.keys(patch).reduce((acc, key) => ({
          ...acc,
          [`metadata.${key}`]: (patch as any)[key]
        }), {})
      });
    } catch (err) {
      console.error("Failed to update session metadata:", err);
    }
  };

  const startTimer = (duration: number) => {
    updateMetadata({
      timerStatus: 'running',
      timerStartTime: Date.now(),
      timerDuration: duration
    });
  };

  const stopTimer = () => {
    updateMetadata({ timerStatus: 'ended' });
  };

  const updateReport = (content: string) => {
    updateMetadata({ liveReport: content });
  };

  const archiveReport = async () => {
    await updateMetadata({ isArchived: true });
    // In a real app, you might also copy this to a 'reports' collection
  };

  return {
    metadata,
    updateMetadata,
    startTimer,
    stopTimer,
    updateReport,
    archiveReport
  };
}
