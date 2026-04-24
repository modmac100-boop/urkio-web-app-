import React from 'react';
import { X, Copy, Check, MessageCircle, ExternalLink, ShieldCheck, Search, Send, User, Share2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface SessionInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  joinUrl: string;
}

export function SessionInviteModal({ isOpen, onClose, roomId, joinUrl }: SessionInviteModalProps) {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        // Try searching by displayName (prefix)
        const qName = query(
          collection(db, 'users'),
          where('displayName', '>=', searchQuery),
          where('displayName', '<=', searchQuery + '\uf8ff')
        );
        
        // Try searching by email (exact or prefix if lowercase)
        const qEmail = query(
          collection(db, 'users'),
          where('email', '>=', searchQuery.toLowerCase()),
          where('email', '<=', searchQuery.toLowerCase() + '\uf8ff')
        );

        const [snapName, snapEmail] = await Promise.all([getDocs(qName), getDocs(qEmail)]);
        
        const combined = [...snapName.docs, ...snapEmail.docs].map(d => ({ id: d.id, ...d.data() }));
        // Deduplicate and filter out current user
        const unique = Array.from(new Map(combined.map(u => [u.id, u])).values())
          .filter(u => u.id !== auth.currentUser?.uid);
        
        setSearchResults(unique);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendInvite = async (user: any) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: user.id,
        type: 'session_invite',
        title: 'New Session Invite',
        content: `You have been invited to a secure session: ${roomId}`,
        roomId: roomId,
        joinUrl: joinUrl,
        senderId: auth.currentUser?.uid,
        senderName: auth.currentUser?.displayName || 'Urkio Specialist',
        createdAt: serverTimestamp(),
        read: false
      });
      // Also send a message to the direct chat if possible
      // (Skipping complex chat resolution for now, just notification is enough for 'Invite')
      toast.success(`Invite sent to ${user.displayName}`);
    } catch (err) {
      toast.error("Failed to send invite");
    }
  };

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Urkio Secure Session',
          text: `Join my secure healing session on Urkio. Code: ${roomId}`,
          url: joinUrl,
        });
        toast.success('Shared successfully');
      } catch (err) {
        console.warn('Share cancelled or failed:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-101 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 transform animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Invite to Session</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Secure & Encrypted</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400"
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Join Link Section */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 block px-1">
                Direct Join Link
              </label>
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl group hover:border-primary/30 transition-colors">
                  <input 
                    type="text" 
                    readOnly 
                    value={joinUrl}
                    className="flex-1 bg-transparent border-none text-sm text-slate-600 dark:text-slate-300 px-2 focus:ring-0 font-medium truncate"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className={clsx(
                      "p-2.5 rounded-xl transition-all flex items-center gap-2",
                      copiedLink ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20"
                    )}
                  >
                    {copiedLink ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </button>
                  <button 
                     onClick={handleShare}
                     className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 flex items-center gap-2 transition-all"
                  >
                    <Share2 className="size-4" />
                    <span className="text-xs font-bold px-1">Share</span>
                  </button>
                </div>
            </div>

            {/* Room ID Section */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 block px-1">
                Healing Code (Room ID)
              </label>
              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl group hover:border-primary/30 transition-colors">
                <input 
                  type="text" 
                  readOnly 
                  value={roomId}
                  className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-white px-2 focus:ring-0 font-mono font-bold tracking-wider"
                />
                <button 
                  onClick={handleCopyId}
                  className={clsx(
                    "p-2.5 rounded-xl transition-all flex items-center gap-2",
                    copiedId ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
                  )}
                >
                  {copiedId ? <Check className="size-4" /> : <Copy className="size-4" />}
                  <span className="text-xs font-bold px-1">{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
              <div className="flex gap-3">
                <div className="size-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5">
                  <MessageCircle className="size-5" />
                </div>
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-400">
                  <span className="font-bold">Instructions:</span> Send this link or code to your participant. They will need to sign in to Urkio to join the secure session.
                </p>
              </div>
            </div>

            {/* User Search & Invite */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 block px-1">
                   Invite Urkio Members
                </label>
                <div className="relative">
                   <div className="absolute inset-y-0 inset-s-4 flex items-center pointer-events-none">
                      <Search className="size-4 text-slate-400" />
                   </div>
                   <input 
                     type="text"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search by name..."
                     className="w-full ps-10 pe-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                   />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                   {isSearching ? (
                     <div className="py-4 text-center">
                        <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                     </div>
                   ) : searchResults.map(u => (
                     <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-white/5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3">
                           <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} alt="" className="size-8 rounded-full border border-white/20" />
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{u.displayName}</span>
                        </div>
                        <button 
                          onClick={() => handleSendInvite(u)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                        >
                           <Send className="size-4" />
                        </button>
                     </div>
                   ))}
                   {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                      <p className="text-center py-4 text-xs text-slate-400">No members found.</p>
                   )}
                </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 dark:bg-white/20 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">End-to-End Encrypted</p>
          <button 
            onClick={onClose}
            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors px-2 py-1"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
