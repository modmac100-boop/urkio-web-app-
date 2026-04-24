import React, { useState, useEffect } from 'react';
import { X, Search, User, Loader2, MessageSquare, Heart } from 'lucide-react';
import { doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { FollowButton } from './FollowButton';
import clsx from 'clsx';

interface InteractionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  currentUserId?: string;
  title?: string;
}

export function InteractionsModal({
  isOpen,
  onClose,
  postId,
  currentUserId,
  title = 'Post Insights'
}: InteractionsModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && postId) {
      fetchUsers();
    }
  }, [isOpen, postId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (!postDoc.exists()) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const postData = postDoc.data();
      const likedBy = postData.likedBy || [];

      if (likedBy.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Fetch user details for each ID (limited to first 50)
      const usersData = await Promise.all(
        likedBy.slice(0, 50).map(async (id: string) => {
          const userDoc = await getDoc(doc(db, 'users', id));
          return userDoc.exists() ? { id, ...userDoc.data() } : null;
        })
      );

      setUsers(usersData.filter(u => u !== null));
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = (e: React.MouseEvent, targetUid: string) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    navigate(`/messenger?userId=${targetUid}`);
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[3rem] w-full max-w-md shadow-2xl border border-white/20 dark:border-slate-800 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-linear-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {title}
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                {users.length} Interacting Users
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shadow-sm bg-white dark:bg-slate-800"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6">
          <div className="relative group">
            <Search className="absolute inset-s-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder={`Search interactions...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-12 pe-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 text-sm font-bold placeholder:text-slate-400 transition-all outline-none"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compiling Insights...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between group p-3 rounded-4xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                  <Link 
                    to={`/user/${user.id}`} 
                    onClick={onClose}
                    className="flex items-center gap-4 flex-1"
                  >
                    <div className="relative shrink-0">
                      <div className="absolute -inset-0.5 bg-linear-to-tr from-primary to-accent rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity blur-[2px]" />
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} 
                        alt={user.displayName}
                        className="relative size-12 rounded-2xl border-2 border-white dark:border-slate-900 object-cover shadow-sm"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                        {user.displayName || 'Architectural Expert'}
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                        {user.role || 'Member'}
                        {user.isVerified && <span className="material-symbols-outlined text-[12px] text-primary fill-1">verified</span>}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleMessage(e, user.id)}
                      className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90 border border-primary/10"
                      title="Send Message"
                    >
                      <MessageSquare className="size-4" />
                    </button>
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
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
              <User className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">No Interactions</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Be the first to react!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
