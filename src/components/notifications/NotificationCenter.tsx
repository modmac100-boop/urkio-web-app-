import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, limit, writeBatch } from 'firebase/firestore';
import { Bell, MessageSquare, UserPlus, Calendar, CheckSquare, Trash2, X, Video, LogIn } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../contexts/AppContext';

interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'follow' | 'event_reminder' | 'task' | 'call' | 'session_invite' | 'live_stream_invite';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: any;
  roomId?: string;
}

interface NotificationCenterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ userId, isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem('pushConfigured') === 'true');
  const [pushSupported, setPushSupported] = useState(false);
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setActiveChatPartner } = useApp();

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!userId || !isOpen) return;

    setLoading(true);

    const handleSnapshot = (snapshot: any) => {
      const notifs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      // Manual sort for stability, especially when fallback is used
      notifs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setNotifications(notifs);
      setLoading(false);
    };

    // Attempting ordered query
    const qWithOrder = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    let activeUnsub: () => void;
    
    try {
      activeUnsub = onSnapshot(qWithOrder, handleSnapshot, (err) => {
        console.warn("[Notifications] Ordered query failed, using basic fallback:", err.message);
        
        // Fallback: simplified query without ordering
        const qBasic = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          limit(50)
        );
        
        // Clear the old unsub if it was even established
        if (activeUnsub) activeUnsub();

        activeUnsub = onSnapshot(qBasic, handleSnapshot, (err2) => {
          console.error("[Notifications] Basic query failed:", err2);
          setLoading(false);
        });
      });
    } catch (e) {
      console.error("[Notifications] Initialization error:", e);
      setLoading(false);
    }

    return () => {
      if (activeUnsub) activeUnsub();
    };
  }, [userId, isOpen]);

  const enablePushNotifications = async () => {
    if (!pushSupported) return;
    setIsRequestingPush(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const { messaging } = await import('../../firebase');
        if (!messaging) throw new Error("Messaging not supported");
        const { getToken } = await import('firebase/messaging');
        
        const vapidKey = 'BK3tfpz8q4iwHeDMzeZ5dj9kJfqvqeieYua689dDRKBeZlc0pylYh2ZARj_ouaQqHjjuDmMd2-CxKWKU6jlA-HM';

        const token = await getToken(messaging, { vapidKey });
        if (token && userId) {
          await updateDoc(doc(db, 'users', userId), { fcmToken: token });
          localStorage.setItem('pushConfigured', 'true');
          setPushEnabled(true);
        }
      } else {
        localStorage.setItem('pushConfigured', 'true');
        setPushEnabled(true);
      }
    } catch (err) {
      console.error("Failed to enable push notifications", err);
    } finally {
      setIsRequestingPush(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await writeBatch(db).delete(doc(db, 'notifications', id)).commit();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if ((notification.type === 'message' || notification.type === 'call') && notification.data?.conversationId) {
      navigate(`/inbox?id=${notification.data.conversationId}`);
    } else if (notification.type === 'session_invite' || notification.type === 'live_stream_invite') {
      const roomId = notification.roomId || notification.data?.roomId;
      if (roomId) navigate(`/room/${roomId}`);
    } else if (notification.type === 'follow' && notification.data?.followerId) {
      navigate(`/user/${notification.data.followerId}`);
    } else if (notification.type === 'event_reminder' && notification.data?.eventId) {
      navigate('/events');
    }
    
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'live_stream_invite':
      case 'session_invite': return <LogIn className="w-5 h-5 text-blue-500" />;
      case 'call': return <Video className="w-5 h-5 text-emerald-500" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'event_reminder': return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'task': return <CheckSquare className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile/tablet to catch clicks outside */}
      <div 
        className="fixed inset-0 bg-black/5 dark:bg-black/20 z-1000 sm:hidden"
        onClick={onClose}
      />
      
      <div className="fixed top-16 inset-e-0 sm:inset-e-4 w-full sm:w-96 max-h-[calc(100vh-80px)] bg-white dark:bg-zinc-900 rounded-none sm:rounded-2xl shadow-2xl border-b sm:border border-zinc-100 dark:border-zinc-800 z-[1001] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/30">
        <h3 className="font-headline font-black text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight">
          <Bell className="w-5 h-5 text-ur-primary dark:text-blue-400" />
          {t('notifications.title', 'Notifications')}
        </h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            className="text-[10px] font-black uppercase tracking-widest text-ur-primary dark:text-blue-400 hover:opacity-80 transition-opacity"
          >
            {t('notifications.markAllRead', 'Mark Read')}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 min-h-[200px]">
        {pushSupported && !pushEnabled && (
          <div className="mb-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl relative group">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0 pe-6">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Stay Updated</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  Enable Desktop Notifications to receive critical notes and updates while away from the platform.
                </p>
                <button 
                  onClick={enablePushNotifications}
                  disabled={isRequestingPush}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm"
                >
                  {isRequestingPush ? 'Configuring...' : 'Enable Notifications'}
                </button>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.setItem('pushConfigured', 'true');
                setPushEnabled(true);
              }}
              className="absolute top-2 inset-e-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500">{t('common.loading')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">{t('notifications.emptyTitle', 'All caught up!')}</p>
            <p className="text-xs text-slate-500 italic">{t('notifications.emptyBody', 'No new notifications to show.')}</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="relative group">
              <button
                onClick={() => handleNotificationClick(notif)}
                className={clsx(
                  "w-full flex gap-3 p-3 rounded-xl transition-all text-start relative",
                  notif.read ? "opacity-60 grayscale-[0.5]" : "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 shadow-sm"
                )}
              >
                <div className={clsx(
                  "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  notif.read ? "bg-slate-100 dark:bg-slate-800" : "bg-white dark:bg-background-dark shadow-sm border border-slate-100 dark:border-slate-800"
                )}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0 ltr:pr-4 rtl:pl-4">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={clsx("text-sm truncate", notif.read ? "font-medium text-slate-700 dark:text-slate-300" : "font-bold text-slate-900 dark:text-white")}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap ms-2">
                      {notif.createdAt && formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-1">
                    {notif.body}
                  </p>
                  {(notif.type === 'session_invite' || notif.type === 'live_stream_invite') && !notif.read && (
                    <div className="mt-2 flex gap-2">
                      <button 
                        className="px-3 py-1 bg-ur-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5"
                        onClick={(e) => { e.stopPropagation(); handleNotificationClick(notif); }}
                      >
                        <Video className="w-3 h-3" />
                        Join Session
                      </button>
                    </div>
                  )}
                </div>
                {!notif.read && notif.type !== 'session_invite' && notif.type !== 'live_stream_invite' && (
                  <div className="absolute inset-e-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                )}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif.id);
                }}
                className="absolute top-2 inset-e-2 p-1 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
        <button 
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
          className="text-xs font-bold text-slate-500 hover:text-primary transition-colors"
        >
          {t('notifications.viewHistory', 'View Notification History')}
        </button>
      </div>
    </div>
  </>
);
}
