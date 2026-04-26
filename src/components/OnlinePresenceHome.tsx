import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface OnlineUser {
  id: string;
  displayName: string;
  photoURL: string;
  role: string;
  isOnline: boolean;
  specialization?: string;
  statusMessage?: string;
  statusActivity?: string;
  isSpecialist?: boolean;
  verificationStatus?: string;
  statusUpdatedAt?: any;
  hasActiveStory?: boolean;
  email: string;
}

export function OnlinePresenceHome({ user }: { user: any }) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch users for the Stories bar (Admins, Urkio, Experts + circle members)
    const setupListeners = async () => {
      let circleIds: string[] = [];
      if (user?.uid) {
        try {
          const followingQuery = query(collection(db, 'follows'), where('followerId', '==', user.uid));
          const followersQuery = query(collection(db, 'follows'), where('followingId', '==', user.uid));
          const [followingSnap, followersSnap] = await Promise.all([
            getDocs(followingQuery),
            getDocs(followersQuery)
          ]);
          const ids = new Set<string>();
          followingSnap.docs.forEach(d => ids.add(d.data().followingId));
          followersSnap.docs.forEach(d => ids.add(d.data().followerId));
          circleIds = Array.from(ids).filter(id => id !== user.uid);
        } catch (error) {
          console.error("Error fetching circle IDs:", error);
        }
      }

      const qUsers = query(collection(db, 'users'), limit(500));
      
      const unsub = onSnapshot(qUsers, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OnlineUser));
        
        const filtered = users.filter(u => {
          if (u.id === user?.uid) return false; // Don't show self in status bar
          if (u.isDeleted) return false; // Hide deleted users
          
          const role = (u.role || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          const name = (u.displayName || '').toLowerCase();
          
          // Ensure it is a "real" account (has email, not guest)
          if (!u.email || name.includes('guest') || email.includes('guest')) return false;
          
          const isAdmin = ['admin', 'management', 'founder'].includes(role) || name.includes('admin') || name.includes('urkio') || email.includes('admin') || email.includes('urkio');
          const isExpert = ['specialist', 'expert', 'case_manager', 'practitioner'].includes(role) || u.isSpecialist || ['approved', 'verified'].includes(u.verificationStatus || '');
          const isCircle = circleIds.includes(u.id);
          
          // Strict 24-Hour Expiry Logic
          const statusDate = u.statusUpdatedAt?.toDate ? u.statusUpdatedAt.toDate() : new Date(u.statusUpdatedAt || 0);
          const isExpired = (Date.now() - statusDate.getTime()) > 24 * 60 * 60 * 1000;
          
          // Only show if has explicitly activated story AND not expired
          if (!u.hasActiveStory || isExpired) return false;
          
          return isAdmin || isExpert || isCircle;
        }).sort((a, b) => {
          // Online first
          if (a.isOnline && !b.isOnline) return -1;
          if (!a.isOnline && b.isOnline) return 1;
          return 0;
        });

        setOnlineUsers(filtered.slice(0, 25)); // Show up to 25 story bubbles
      });

      return unsub;
    };

    const cleanupPromise = setupListeners();

    return () => {
      cleanupPromise.then(unsub => unsub && unsub());
    };
  }, [user?.uid]);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="mb-10 w-full overflow-hidden">
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 scroll-smooth no-scrollbar snap-x">
        {onlineUsers.map((onlineUser) => (
          <div
            key={onlineUser.id}
            className="shrink-0 w-20 md:w-24 flex flex-col items-center group cursor-pointer snap-start"
            onClick={() => navigate(`/user/${onlineUser.id}`)}
          >
            {/* Insta-style circle with gradient border */}
            <div className="relative mb-2">
              <div className="w-[72px] h-[72px] md:w-[84px] md:h-[84px] rounded-full p-[3px] bg-linear-to-tr from-amber-400 via-pink-500 to-purple-600 shadow-md group-hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center">
                <img
                  src={onlineUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(onlineUser.displayName)}`}
                  alt={onlineUser.displayName}
                  className="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-zinc-900 bg-white dark:bg-zinc-800"
                />
              </div>
              
              {/* Online indicator */}
              {onlineUser.isOnline && (
                <div className="absolute bottom-1 inset-e-1 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-white dark:border-zinc-900 shadow-[0_0_8px_rgba(16,185,129,0.5)] z-10"></div>
              )}
              
              {/* Activity emoji */}
              {onlineUser.statusActivity && (
                <div className="absolute -top-1 -inset-s-1 size-6 md:size-7 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-xs md:text-sm z-10">
                  {onlineUser.statusActivity}
                </div>
              )}
            </div>
            
            <p className="text-[10px] md:text-xs font-headline font-black text-slate-800 dark:text-zinc-200 truncate w-full text-center px-1 tracking-wide">
              {onlineUser.displayName?.split(' ')[0]}
            </p>
            <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 truncate w-full text-center px-1 font-bold">
              {onlineUser.statusMessage || (onlineUser.role === 'specialist' || (onlineUser.isSpecialist) ? onlineUser.specialization || 'Expert' : 'Network')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

