import React, { useState, useEffect } from 'react';
import { collection, query, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, X, Users, Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

export function CreateGroupModal({ 
  onClose, 
  currentUserId,
  onSuccess 
}: { 
  onClose: () => void; 
  currentUserId: string;
  onSuccess: (id: string, data: any) => void;
}) {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

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

  const toggleUser = (uid: string) => {
    setSelectedUsers(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0 || creating) return;

    setCreating(true);
    try {
      const participants = [currentUserId, ...selectedUsers];
      
      const unreadCount: Record<string, number> = {};
      participants.forEach(id => {
        unreadCount[id] = id === currentUserId ? 0 : 1;
      });

      const docRef = await addDoc(collection(db, 'conversations'), {
        name: groupName,
        type: 'group',
        participants,
        unreadCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: 'Group created',
          senderId: currentUserId,
          timestamp: serverTimestamp()
        }
      });

      onSuccess(docRef.id, {
        displayName: groupName,
        photoURL: '',
        uid: docRef.id,
        isGroup: true
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-5xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Initialize Group</h3>
            <button onClick={onClose} className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
              <X className="size-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Group Protocol Name</label>
              <input 
                type="text"
                placeholder="Urkio Squad B..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Add Target Nodes</label>
              <div className="relative">
                <Search className="absolute inset-s-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search identifiers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full ps-11 pe-5 py-4 bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
          ) : users.length > 0 ? (
            users.map(user => (
              <button
                key={user.uid}
                onClick={() => toggleUser(user.uid)}
                className={clsx(
                  "w-full p-3 flex items-center gap-4 rounded-2xl transition-all border-2",
                  selectedUsers.includes(user.uid)
                    ? "bg-primary/5 border-primary/20"
                    : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <div 
                  className="size-10 rounded-full bg-cover border border-white dark:border-slate-800 shadow-sm"
                  style={{ backgroundImage: `url("${user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}")` }}
                />
                <div className="flex-1 text-start min-w-0">
                  <p className="text-sm font-bold truncate dark:text-white uppercase tracking-tight">{user.displayName}</p>
                </div>
                {selectedUsers.includes(user.uid) && (
                  <div className="size-6 bg-primary rounded-lg flex items-center justify-center text-white">
                    <Check className="size-4" />
                  </div>
                )}
              </button>
            ))
          ) : searchTerm.length > 1 ? (
            <p className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">No nodes found</p>
          ) : null}
        </div>

        <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
          <button
            disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
            onClick={handleCreate}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Users className="size-4" />
            )}
            Establish Multi-Link
          </button>
        </div>
      </div>
    </div>
  );
}
