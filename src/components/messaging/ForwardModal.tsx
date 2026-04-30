import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { X, Search, Send, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

interface Contact {
  uid: string;
  displayName: string;
  photoURL: string;
  role: string;
}

export function ForwardModal({ 
  message, 
  currentUser, 
  onClose 
}: { 
  message: any; 
  currentUser: any; 
  onClose: () => void 
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [forwarding, setForwarding] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const q = query(collection(db, 'users'), where('uid', '!=', currentUser.uid));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => doc.data() as Contact);
        setContacts(list);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, [currentUser.uid]);

  const handleForward = async (contact: Contact) => {
    setForwarding(contact.uid);
    try {
      // Find or create conversation with this contact
      const convsQ = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUser.uid),
        where('type', '==', 'individual')
      );
      const convsSnapshot = await getDocs(convsQ);
      let targetConvId = convsSnapshot.docs.find(doc => 
        doc.data().participants.includes(contact.uid)
      )?.id;

      if (!targetConvId) {
        const newConv = await addDoc(collection(db, 'conversations'), {
          participants: [currentUser.uid, contact.uid],
          type: 'individual',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadCount: { [currentUser.uid]: 0, [contact.uid]: 1 },
          lastMessage: { text: message.text || '[Forwarded Message]', senderId: currentUser.uid, timestamp: serverTimestamp() }
        });
        targetConvId = newConv.id;
      }

      // Send the forwarded message
      const forwardData: any = {
        senderId: currentUser.uid,
        text: message.text || '',
        type: message.type || 'text',
        timestamp: serverTimestamp(),
        read: false,
        isForwarded: true
      };

      if (message.fileUrl) forwardData.fileUrl = message.fileUrl;
      if (message.videoUrl) forwardData.videoUrl = message.videoUrl;
      if (message.audioUrl) forwardData.audioUrl = message.audioUrl;

      await addDoc(collection(db, 'conversations', targetConvId, 'messages'), forwardData);
      
      await updateDoc(doc(db, 'conversations', targetConvId), {
        lastMessage: { text: forwardData.text || '[Forwarded Message]', senderId: currentUser.uid, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp(),
        [`unreadCount.${contact.uid}`]: increment(1)
      });

      toast.success(`Forwarded to ${contact.displayName}`);
      onClose();
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast.error('Failed to forward message');
    } finally {
      setForwarding(null);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-msgr-surface-container-low w-full max-w-md rounded-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-msgr-outline-variant flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black italic text-zinc-900 uppercase tracking-tighter">Forward Message</h3>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Select recipient</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-msgr-surface-container border-none rounded-2xl text-sm focus:ring-2 focus:ring-msgr-primary/20"
            />
          </div>

          <div className="h-80 overflow-y-auto custom-scrollbar space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="animate-spin text-msgr-primary" size={24} />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loading circle...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-zinc-400 font-medium">No contacts found</p>
              </div>
            ) : (
              filteredContacts.map(contact => (
                <button
                  key={contact.uid}
                  onClick={() => handleForward(contact)}
                  disabled={!!forwarding}
                  className="w-full flex items-center gap-4 p-3 hover:bg-msgr-surface-container-high rounded-2xl transition-all group active:scale-[0.98]"
                >
                  <img 
                    src={contact.photoURL || `https://ui-avatars.com/api/?name=${contact.displayName}`} 
                    className="w-11 h-11 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                    alt=""
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-black text-zinc-900 italic tracking-tight uppercase leading-none mb-1">{contact.displayName}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{contact.role || 'Member'}</p>
                  </div>
                  {forwarding === contact.uid ? (
                    <Loader2 className="animate-spin text-msgr-primary" size={18} />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-msgr-primary/10 transition-colors">
                      <Send size={14} className="text-zinc-400 group-hover:text-msgr-primary" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-4 bg-msgr-surface-container-low border-t border-msgr-outline-variant">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center">
            Messages are end-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
