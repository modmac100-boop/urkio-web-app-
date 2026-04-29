import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

export function NewMessageModal({ 
  onClose, 
  currentUserId,
  onSuccess 
}: { 
  onClose: () => void; 
  currentUserId: string;
  onSuccess: (id: string, data: any) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchTerm.length < 2) {
        setUsers([]);
        return;
      }
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(query(usersRef, limit(50)));
        const usersData = usersSnap.docs
          .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
          .filter(user => user.uid !== currentUserId)
          .filter(u => 
            u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .slice(0, 10);
        
        setUsers(usersData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, currentUserId]);

  const handleSelectUser = async (user: UserProfile) => {
    try {
      // Check if conversation already exists
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUserId),
        where('type', '==', 'individual')
      );
      
      const snap = await getDocs(q);
      const existing = snap.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(user.uid);
      });

      if (existing) {
        onSuccess(existing.id, {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      } else {
        // Use 'new' as initial state to let ChatWindow handle creation on first message
        onSuccess('new', {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1b1c1a]/60 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-[#faf9f6] rounded-[3rem] shadow-2xl overflow-hidden border border-white/50 ring-1 ring-zinc-100"
      >
        <div className="p-10 pb-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-headline text-2xl font-black italic uppercase tracking-tighter text-msgr-on-surface leading-none mb-1">Secure Node Scan</h3>
              <p className="text-[10px] font-black text-msgr-primary uppercase tracking-widest">Network Access Authorization</p>
            </div>
            <button onClick={onClose} className="size-12 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center text-zinc-400 hover:text-msgr-primary transition-all active:scale-95">
              <X className="size-5" />
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-msgr-primary transition-colors" />
            <input 
              type="text"
              placeholder="Enter node identifier (Name or Email)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border border-stone-100 rounded-4xl text-sm font-body outline-none focus:ring-4 focus:ring-msgr-primary/10 focus:border-msgr-primary/30 transition-all shadow-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto px-6 pb-10 space-y-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="size-10 border-4 border-msgr-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[9px] font-black text-msgr-primary uppercase tracking-[0.3em] animate-pulse">Syncing Directory...</p>
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-3">
               <p className="px-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Discovery Results ({users.length})</p>
               {users.map(user => (
                <button
                  key={user.uid}
                  onClick={() => handleSelectUser(user)}
                  className="w-full p-4 flex items-center gap-5 rounded-4xl transition-all bg-white hover:bg-msgr-primary/5 border border-stone-50 hover:border-msgr-primary/20 group text-start relative overflow-hidden"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-msgr-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                    className="size-14 rounded-[1.25rem] object-cover shadow-md border-2 border-white group-hover:scale-105 transition-transform" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-black italic uppercase tracking-tight text-zinc-900 leading-tight mb-1">{user.displayName}</p>
                    <p className="text-[10px] font-bold text-zinc-400 truncate uppercase tracking-widest">{user.email}</p>
                  </div>
                  <div className="size-10 rounded-xl bg-white shadow-sm border border-stone-100 flex items-center justify-center text-msgr-primary opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <Plus className="size-5" />
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length > 2 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-stone-50 mb-6">
                 <span className="material-symbols-outlined text-zinc-300 text-3xl">cloud_off</span>
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Zero Node Intercepts</p>
            </div>
          ) : (
            <div className="text-center py-16 flex flex-col items-center">
               <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-stone-50 mb-6 animate-bounce">
                  <span className="material-symbols-outlined text-msgr-primary text-3xl">hub</span>
               </div>
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] max-w-[200px] leading-relaxed">
                  Initiate credential stream to scan clinical network
               </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
