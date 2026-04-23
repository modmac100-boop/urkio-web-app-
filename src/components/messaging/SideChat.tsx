import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { ChatWindow } from './ChatWindow';

interface SideChatProps {
  partner: any;
  currentUser: any;
  userData?: any;
  onClose: () => void;
}

export function SideChat({ partner, currentUser, userData, onClose }: SideChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid || !partner?.uid) return;

    let isMounted = true;

    const findOrCreateConversation = async () => {
      setLoading(true);
      try {
        // Look for existing 1:1 conversation without orderBy to avoid index requirements
        // Filtering is done in memory for reliability
        const q = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', currentUser.uid),
          limit(150)
        );
        
        const snapshot = await getDocs(q);
        if (!isMounted) return;

        const existing = snapshot.docs.find(doc => {
          const data = doc.data();
          const p = data.participants || [];
          // Individual chat check
          return p.length === 2 && p.includes(partner.uid) && (data.type === 'individual' || !data.type);
        });

        if (existing) {
          setConversationId(existing.id);
        } else {
          // If no existing conversation, use 'new' status
          // This allows ChatWindow to handle creation on first message
          setConversationId('new');
        }
      } catch (error) {
        console.error("SideChat: Initialization error:", error);
        // Fallback to 'new' even on query error to ensure UI works
        if (isMounted) setConversationId('new');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    findOrCreateConversation();
    return () => { isMounted = false; };
  }, [partner?.uid, currentUser?.uid, userData]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 600, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1
        }}
        exit={{ y: 600, opacity: 0 }}
        className={clsx(
          "fixed bottom-0 inset-e-8 z-70 bg-[#0A0C14] shadow-[0_-8px_30px_rgb(0,0,0,0.5)] rounded-t-xl border-x border-t border-white/10 overflow-hidden flex flex-col transition-all duration-300 backdrop-blur-3xl",
          isMinimized ? "h-16 w-64" : "h-[500px] w-80"
        )}
      >
        {/* Header */}
        <div 
          className="h-12 px-4 bg-[#0F111A] hover:bg-[#161821] text-white flex items-center justify-between shrink-0 cursor-pointer border-b border-white/5 transition-colors" 
          onClick={() => isMinimized && setIsMinimized(false)}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <img 
                src={partner.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.displayName)}&background=random`} 
                alt={partner.displayName}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
              />
              <div className={clsx(
                "absolute -bottom-0.5 -inset-e-0.5 w-2.5 h-2.5 border-2 border-[#0F111A] rounded-full",
                partner.isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-600"
              )} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs truncate text-white/90">{partner.displayName}</p>
              {!isMinimized && <p className="text-[9px] text-white/40 font-black uppercase tracking-wider">{partner.isOnline ? 'Active' : 'Offline'}</p>}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        {!isMinimized && (
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 bg-background-dark/20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Encrypting Chat</p>
              </div>
            ) : conversationId ? (
              <ChatWindow
                conversationId={conversationId}
                currentUser={{ ...currentUser, ...userData }}
                partner={partner}
                simplified={true}
              />
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-center">
                <p className="text-xs text-white/40">Could not initialize secure chat. Please try again.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
