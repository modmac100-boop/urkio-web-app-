import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { Bell, MessageSquare, UserPlus, Calendar, CheckSquare, Trash2, CheckCircle2, MoreHorizontal, Settings, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';

interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'follow' | 'event_reminder' | 'task';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: any;
}

interface NotificationsPageProps {
  user: any;
  userData: any;
}

export function Notifications({ user, userData }: NotificationsPageProps) {
  const { setActiveChatPartner } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user?.uid) return;

    // First, try with ordering (requires index)
    const qWithOrder = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Fallback if index is missing
    const qBasic = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const handleSnapshot = (snapshot: any) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      // Manual sort fallback
      if (notifs.length > 0) {
        notifs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      }
      
      setNotifications(notifs);
      setLoading(false);
    };

    let unsubscribe = onSnapshot(qWithOrder, handleSnapshot, (err) => {
      console.warn("Ordered notifications page query failed, falling back...", err);
      unsubscribe = onSnapshot(qBasic, handleSnapshot, (err2) => {
        console.error("Basic notifications page query failed:", err2);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, [user?.uid]);

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
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-6 h-6 text-blue-500" />;
      case 'follow': return <UserPlus className="w-6 h-6 text-green-500" />;
      case 'event_reminder': return <Calendar className="w-6 h-6 text-purple-500" />;
      case 'task': return <CheckSquare className="w-6 h-6 text-amber-500" />;
      default: return <Bell className="w-6 h-6 text-slate-500" />;
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                <Bell className="w-8 h-8 text-primary" />
                {t('notifications.title', 'Notifications')}
              </h1>
              <p className="text-slate-500 text-sm font-medium">Stay updated with your latest activity</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold text-xs uppercase tracking-wider"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark all read
            </button>
            <button 
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all font-bold text-xs uppercase tracking-wider"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <button 
            onClick={() => setFilter('all')}
            className={clsx(
              "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
              filter === 'all' 
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg" 
                : "bg-white/50 dark:bg-slate-900/50 text-slate-500 hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800"
            )}
          >
            All Activity
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={clsx(
              "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all relative",
              filter === 'unread' 
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg" 
                : "bg-white/50 dark:bg-slate-900/50 text-slate-500 hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800"
            )}
          >
            Unread
            {notifications.some(n => !n.read) && (
              <span className="absolute -top-1 -inset-e-1 w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            )}
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Sanctuary Updates...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-5xl p-20 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-primary opacity-50" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">All caught up!</h2>
              <p className="text-slate-500 max-w-xs">You don't have any {filter === 'unread' ? 'unread' : ''} notifications at the moment. Come back later for more updates.</p>
            </div>
          ) : (
            filteredNotifications.map((notif, index) => (
              <div 
                key={notif.id}
                className={clsx(
                  "group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border rounded-4xl p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4",
                  notif.read 
                    ? "border-white/10 dark:border-slate-800/50 opacity-70" 
                    : "border-primary/20 dark:border-primary/20 shadow-xl shadow-primary/5 hover:border-primary/40",
                  `delay-[${index * 50}ms]`
                )}
              >
                <div className="flex items-start gap-6">
                  <div className={clsx(
                    "shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105",
                    notif.read ? "bg-slate-100 dark:bg-slate-800" : "bg-primary/10"
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={clsx("text-lg font-black tracking-tight", notif.read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white")}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {notif.createdAt && formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {notif.body}
                    </p>
                    
                    <div className="mt-4 flex items-center gap-4">
                      <button 
                        onClick={() => {
                          if (notif.type === 'message' && notif.data?.senderId) {
                            setActiveChatPartner({
                              uid: notif.data.senderId,
                              displayName: notif.data.senderName || 'User',
                              photoURL: notif.data.senderPhoto || null
                            });
                          } else if (notif.type === 'follow' && notif.data?.followerId) {
                            navigate(`/user/${notif.data.followerId}`);
                          } else if (notif.type === 'event_reminder' && notif.data?.eventId) {
                            navigate('/events');
                          }
                          markAsRead(notif.id);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline hover:underline-offset-4"
                      >
                        Action Details
                      </button>
                      {!notif.read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => deleteNotification(notif.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {!notif.read && (
                      <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50 self-center"></div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
