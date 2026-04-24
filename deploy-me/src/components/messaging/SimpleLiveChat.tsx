import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { Send, Loader2, User } from 'lucide-react';
import clsx from 'clsx';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
}

interface SimpleLiveChatProps {
  sessionId: string;
  user: any;
  userData: any;
}

export function SimpleLiveChat({ sessionId, user, userData }: SimpleLiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;

    const messagesRef = collection(db, 'calls', sessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId || sending) return;

    setSending(true);
    try {
      const messagesRef = collection(db, 'calls', sessionId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: userData?.displayName || user.displayName || 'Urkio User',
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth no-scrollbar"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <Loader2 className="size-6 animate-spin mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading Chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-40">
            <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
               <User className="size-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
            <p className="text-[10px] mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user.uid;
            return (
              <div 
                key={msg.id}
                className={clsx(
                  "flex flex-col max-w-[85%]",
                  isMe ? "ms-auto items-end" : "me-auto items-start"
                )}
              >
                {!isMe && (
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500 mb-1 ms-1">
                    {msg.senderName}
                  </span>
                )}
                <div className={clsx(
                  "px-4 py-2.5 rounded-2xl text-sm transition-all",
                  isMe 
                    ? "bg-primary text-white rounded-se-none shadow-lg shadow-primary/20" 
                    : "bg-white/10 text-slate-200 rounded-ss-none border border-white/5"
                )}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSendMessage}
        className="p-4 bg-black/40 border-t border-white/10"
      >
        <div className="relative flex items-center gap-2">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={clsx(
              "size-11 rounded-xl flex items-center justify-center transition-all shrink-0",
              newMessage.trim() && !sending ? "bg-primary text-white scale-100 shadow-lg shadow-primary/20" : "bg-white/5 text-slate-600 scale-95 cursor-not-allowed"
            )}
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
