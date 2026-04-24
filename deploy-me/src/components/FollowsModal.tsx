import React, { useState, useEffect } from 'react';
import { X, Search, User, Loader2, Hand, MessageSquare } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { GlassButton } from './GlassButton';
import { FollowButton } from './FollowButton';
import clsx from 'clsx';

interface FollowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  currentUserId?: string;
}

export function FollowsModal({
  isOpen,
  onClose,
  userId,
  type,
  currentUserId
}: FollowsModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pokingIds, setPokingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const handlePoke = async (e: React.MouseEvent, targetUid: string, targetName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId || pokingIds.has(targetUid)) return;

    setPokingIds(prev => new Set(prev).add(targetUid));
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: targetUid,
        type: 'message',
        title: '👉 New Poke!',
        body: `Someone poked you! Tap to see their profile.`,
        read: false,
        data: { senderId: currentUserId, type: 'poke' },
        createdAt: serverTimestamp()
      });
      
      // Also track in a pokes collection for history/features
      await addDoc(collection(db, 'pokes'), {
        fromId: currentUserId,
        toId: targetUid,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error("Error poking user:", error);
    } finally {
      setTimeout(() => {
        setPokingIds(prev => {
          const next = new Set(prev);
          next.delete(targetUid);
          return next;
        });
      }, 3000);
    }
  };

  const handleMessage = (e: React.MouseEvent, targetUid: string) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    navigate(`/inbox?userId=${targetUid}`);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const followsRef = collection(db, 'follows');
      const q = query(
        followsRef,
        where(type === 'followers' ? 'followingId' : 'followerId', '==', userId),
        limit(50)
      );
      
      const followsSnap = await getDocs(q);
      const userIds = followsSnap.docs.map(doc => 
        type === 'followers' ? doc.data().followerId : doc.data().followingId
      );

      if (userIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Fetch user details for each ID
      // Note: Firestore 'in' query is limited to 10-30 IDs usually. 
      // For simplicity here, we'll fetch them individually or in chunks if needed.
      const usersData = await Promise.all(
        userIds.map(async (id) => {
          const userDoc = await getDoc(doc(db, 'users', id));
          return userDoc.exists() ? { id, ...userDoc.data() } : null;
        })
      );

      setUsers(usersData.filter(u => u !== null));
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/20 dark:border-slate-800 flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white capitalize">
              {type}
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              {users.length} {type === 'followers' ? 'people' : 'following'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 px-6">
          <div className="relative group">
            <Search className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder={`Search ${type}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-11 ltr:pr-4 rtl:pl-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 px-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Loading...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between group">
                  <Link 
                    to={`/user/${user.id}`} 
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-linear-to-tr from-primary to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-[1px]" />
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} 
                        alt={user.displayName}
                        className="relative size-12 rounded-full border-2 border-white dark:border-slate-800 object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {user.displayName || 'Unknown User'}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                        {user.role || 'Member'}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleMessage(e, user.id)}
                      className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90"
                      title="Send Message"
                    >
                      <MessageSquare className="size-4" />
                    </button>
                    {currentUserId && currentUserId !== user.id && (
                      <button
                        onClick={(e) => handlePoke(e, user.id, user.displayName)}
                        disabled={pokingIds.has(user.id)}
                        className={clsx(
                          "size-9 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm",
                          pokingIds.has(user.id) 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "bg-linear-to-tr from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 text-amber-600 dark:text-amber-500 hover:shadow-lg hover:shadow-amber-500/10 border border-amber-200/50 dark:border-amber-500/20"
                        )}
                        title="Poke User"
                      >
                        {pokingIds.has(user.id) ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Hand className="size-4" />
                        )}
                      </button>
                    )}
                    {currentUserId && currentUserId !== user.id && (
                      <FollowButton 
                        targetUserId={user.id} 
                        currentUserId={currentUserId}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
