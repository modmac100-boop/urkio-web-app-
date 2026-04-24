/**
 * useWebPushNotifications
 *
 * Requests OS-level browser notification permission, then listens to
 * the Firestore `notifications` collection for the current user.
 * Every new UNREAD notification triggers a native system notification
 * that the user sees on their device — even when the tab is in the background.
 *
 * Works on: macOS, Windows, Android Chrome, iOS Safari 16.4+, most modern browsers.
 */

import { useEffect, useRef, useCallback } from 'react';
import { db, messaging } from '../firebase';
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { getToken } from 'firebase/messaging';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = 'message' | 'follow' | 'event_reminder' | 'task' | 'call';

interface FirestoreNotif {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Timestamp | null;
  data?: Record<string, any>;
}

// Map notification type → emoji badge that appears in OS notification
const TYPE_EMOJI: Record<NotifType, string> = {
  message:        '💬',
  follow:         '👤',
  event_reminder: '📅',
  task:           '✅',
  call:           '📞',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWebPushNotifications(userId: string | null | undefined) {
  // Track which notification IDs we have already shown, to avoid duplicates
  const shownIds = useRef<Set<string>>(new Set());
  // Track the timestamp of subscription start so we only show NEW ones
  const startedAt = useRef<number>(Date.now());

  // ── Request permission & setup FCM ──────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';
    
    const result = await Notification.requestPermission();
    
    // Best-effort FCM token registration — never blocks or throws
    if (result === 'granted' && userId && messaging) {
      // Do this in the background, never await it
      (async () => {
        try {
          const token = await getToken(messaging, {
            vapidKey: 'BK3tfpz8q4iwHeDMzeZ5dj9kJfqvqeieYua689dDRKBeZlc0pylYh2ZARj_ouaQqHjjuDmMd2-CxKWKU6jlA-HM'
          });
          
          if (token) {
            await updateDoc(doc(db, 'users', userId), {
              fcmToken: token,
              notificationsEnabled: true,
              lastTokenUpdate: Date.now()
            });
            console.log('[FCM] Token registered.');
          }
        } catch (err) {
          // This is expected when no service worker is registered — fail silently
          console.warn('[FCM] Token registration skipped (service worker may not be active):', (err as Error)?.message);
        }
      })();
    }
    
    return result;
  }, [userId]);

  // ── Fire a native OS notification ──────────────────────────────────────────
  const fireNotification = useCallback((notif: FirestoreNotif) => {
    if (Notification.permission !== 'granted') return;

    const emoji = TYPE_EMOJI[notif.type] ?? '🔔';
    const title = `${emoji} ${notif.title}`;

    const n = new Notification(title, {
      body: notif.body,
      icon: '/logo.png',          // uses your logo in /public
      badge: '/logo.png',         // shown on mobile lock screen badge
      tag: notif.id,              // prevents duplicate banners for same notif
      requireInteraction: false,  // auto-dismiss after a few seconds
      silent: false,              // allow system sound
    });

    // Click → focus the app tab and navigate to the right page
    n.onclick = () => {
      window.focus();
      // Basic deep-link routing based on type
      if (notif.type === 'message' && notif.data?.conversationId) {
        window.location.hash = `/inbox?id=${notif.data.conversationId}`;
      } else if (notif.type === 'follow' && notif.data?.followerId) {
        window.location.hash = `/user/${notif.data.followerId}`;
      } else if (notif.type === 'event_reminder') {
        window.location.hash = '/events';
      } else {
        window.location.hash = '/notifications';
      }
      n.close();
    };
  }, []);

  // ── Main Firestore listener ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    // Don't set up listener if permission was explicitly denied
    if ('Notification' in window && Notification.permission === 'denied') return;

    startedAt.current = Date.now();

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // Only fire for newly ADDED unread notifications
        if (change.type !== 'added') return;

        const raw = change.doc.data();
        const notif: FirestoreNotif = {
          id: change.doc.id,
          userId:  raw.userId,
          type:    raw.type,
          title:   raw.title  || 'New notification',
          body:    raw.body   || '',
          read:    raw.read   || false,
          createdAt: raw.createdAt ?? null,
          data:    raw.data,
        };

        // Skip if already shown
        if (shownIds.current.has(notif.id)) return;

        // Skip notifications that existed before we subscribed (stale data)
        const notifMs = notif.createdAt?.toMillis?.() ?? 0;
        if (notifMs > 0 && notifMs < startedAt.current - 3000) return;

        shownIds.current.add(notif.id);
        fireNotification(notif);
      });
    });

    return () => unsubscribe();
  }, [userId, fireNotification]);

  return { requestPermission };
}
