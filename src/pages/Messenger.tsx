import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';
import { 
  Search, 
  MoreVertical, 
  Edit3, 
  MessageSquare, 
  Users, 
  Star, 
  Settings, 
  Home, 
  LogOut,
  Check,
  CheckCheck,
  Phone,
  Video,
  Info as InfoIcon,
  X
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useCalls } from '../contexts/CallContext';
import { ChatWindow } from '../components/messaging/ChatWindow';
import { NewMessageModal } from '../components/messaging/NewMessageModal';
import { toast } from 'react-hot-toast';

interface Conversation {
  id: string;
  participants: string[];
  type?: 'individual' | 'group' | 'circle';
  name?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
    read?: boolean;
    type?: string;
  };
  unreadCount?: Record<string, number>;
  updatedAt: any;
  typing?: Record<string, boolean>;
}

interface ParticipantData {
  uid: string;
  displayName: string;
  photoURL: string;
  isOnline?: boolean;
  role?: string;
  specialties?: string[];
  lastSeen?: any;
  userCode?: string;
  isDeleted?: boolean;
}

interface MessengerProps {
  user: any;
  userData: any;
}

const Messenger: React.FC<MessengerProps> = ({ user, userData }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setActiveChatPartner } = useApp();
  const { initiateCall } = useCalls();
  const currentUser = user;
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnersData, setPartnersData] = useState<Record<string, ParticipantData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConvId = searchParams.get('id');
  const partnerIdFromUrl = searchParams.get('partnerId');
  const [selectedPartner, setSelectedPartner] = useState<ParticipantData | null>(null);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

  const isRTL = i18n.language === 'ar';

  // Fetch Conversations
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      async (snapshot) => {
        let convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
        setConversations(convs);
        setLoading(false);

        // Fetch partner data for new conversations
        for (const conv of convs) {
          if (conv.type === 'individual' || !conv.type) {
            const pId = conv.participants.find(id => id !== currentUser.uid);
            if (pId && !partnersData[pId]) {
              fetchPartnerData(pId);
            }
          }
        }
      },
      (error) => {
        console.error("Messenger: Error fetching conversations:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const fetchPartnerData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = { uid, ...userDoc.data() } as ParticipantData;
        setPartnersData(prev => ({ ...prev, [uid]: data }));
        return data;
      }
    } catch (error) {
      console.error("Error fetching partner data:", error);
    }
    return null;
  };

  // Handle partnerId from URL
  useEffect(() => {
    if (partnerIdFromUrl && currentUser) {
      const existingConv = conversations.find(c => 
        (c.type === 'individual' || !c.type) && c.participants.includes(partnerIdFromUrl)
      );

      if (existingConv) {
        setSearchParams({ id: existingConv.id });
      } else {
        const fetchAndSelect = async () => {
          let pData = partnersData[partnerIdFromUrl];
          if (!pData) {
            pData = await fetchPartnerData(partnerIdFromUrl);
          }
          if (pData) {
            setSelectedPartner(pData);
            setSearchParams({ id: 'new', partnerId: partnerIdFromUrl });
          }
        };
        fetchAndSelect();
      }
    }
  }, [partnerIdFromUrl, conversations, currentUser]);

  // Update selected partner when conversation selection changes
  useEffect(() => {
    if (selectedConvId && selectedConvId !== 'new') {
      const conv = conversations.find(c => c.id === selectedConvId);
      if (conv) {
        const pId = conv.participants.find(id => id !== currentUser?.uid);
        if (pId && partnersData[pId]) {
          setSelectedPartner(partnersData[pId]);
        }
      }
    } else if (!selectedConvId && !partnerIdFromUrl) {
      setSelectedPartner(null);
    }
  }, [selectedConvId, conversations, partnersData]);

  const filteredConversations = conversations.filter(conv => {
    const pId = conv.participants.find(id => id !== currentUser?.uid);
    const partner = pId ? partnersData[pId] : null;

    if (partner?.isDeleted) return false;

    const name = partner?.userCode || partner?.displayName || conv.name || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'Unread') return matchesSearch && (conv.unreadCount?.[currentUser?.uid || ''] || 0) > 0;
    if (activeFilter === 'Experts') return matchesSearch && partner?.role === 'specialist';
    if (activeFilter === 'Groups') return matchesSearch && conv.type === 'group';
    
    return matchesSearch;
  });

  useEffect(() => {
    document.title = 'Messenger | Urkio Executive Editorial';
  }, []);

  return (
    <div className="bg-msgr-surface font-body text-on-background h-screen overflow-hidden flex flex-col">
       {/* 🚀 TopNavBar Cluster */}
       <header className="h-16 shrink-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between px-8 z-50">
          <div className="flex items-center gap-8">
             <span className="text-xl font-black tracking-tighter text-msgr-primary dark:text-blue-400">URKIO</span>
             <span className="text-zinc-400 font-light ms-1 uppercase tracking-widest text-[10px]">Editorial</span>
             <div className="hidden lg:flex items-center gap-6">
                <Link to="/messenger" className="text-xs font-bold uppercase tracking-widest text-msgr-primary border-b-2 border-msgr-primary pb-1">Pulse</Link>
                <Link to="/specialist-hub" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900">Network</Link>
                <Link to="/guide" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900">Knowledge</Link>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1">
                <button 
                  onClick={() => selectedPartner ? initiateCall(selectedPartner, 'video', selectedConvId || 'new') : toast.error('Select a conversation partner first')}
                  className="p-2 text-zinc-400 hover:text-msgr-primary transition-colors"
                  title="Global Video Initiate"
                >
                  <span className="material-symbols-outlined text-lg">video_call</span>
                </button>
                <button 
                  onClick={() => selectedPartner ? initiateCall(selectedPartner, 'audio', selectedConvId || 'new') : toast.error('Select a conversation partner first')}
                  className="p-2 text-zinc-400 hover:text-msgr-primary transition-colors"
                  title="Global Phone Initiate"
                >
                  <span className="material-symbols-outlined text-lg">phone</span>
                </button>
                <button className="p-2 text-zinc-400 hover:text-msgr-primary transition-colors"><span className="material-symbols-outlined text-lg">more_vert</span></button>
             </div>
             <img 
               src={userData?.photoURL || currentUser?.photoURL || `https://ui-avatars.com/api/?name=${userData?.userCode || currentUser?.displayName}`} 
               className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" 
               alt="User profile"
             />
          </div>
       </header>

       <div className="flex-1 flex overflow-hidden">
          {/* 💼 SideNavBar (Expert Panel) */}
          <nav className="w-64 shrink-0 bg-[#faf9f6]/50 border-e border-stone-100 hidden xl:flex flex-col p-6">
             <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 bg-msgr-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                   <span className="material-symbols-outlined text-lg">business_center</span>
                </div>
                <div>
                   <h2 className="text-sm font-black italic text-msgr-primary uppercase tracking-tighter">Expert Panel</h2>
                   <p className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase">Verified Network</p>
                </div>
             </div>

              <div className="space-y-1">
                {[
                  { icon: 'assignment', label: 'Active Cases', filter: 'All' },
                  { icon: 'groups', label: 'Consultants', filter: 'Experts' },
                  { icon: 'inventory_2', label: 'Archived', filter: 'Unread' },
                  { icon: 'settings', label: 'Settings', nav: '/settings' }
                ].map((item) => (
                  <div 
                    key={item.label}
                    onClick={() => {
                      if (item.nav) navigate(item.nav);
                      else if (item.filter) setActiveFilter(item.filter);
                    }}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-xs font-black uppercase tracking-widest",
                      activeFilter === item.filter ? "bg-white text-msgr-primary shadow-sm border border-zinc-50" : "text-zinc-500 hover:translate-x-1 hover:text-zinc-900"
                    )}
                  >
                     <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                     <span>{item.label}</span>
                  </div>
                ))}
              </div>

             <button 
                onClick={() => setIsNewMessageModalOpen(true)}
                className="mt-auto py-4 rounded-2xl bg-linear-to-br from-msgr-primary to-msgr-primary-container text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
             >
                Start New Case
             </button>
          </nav>

          {/* 📩 Inbox List */}
          <section className="w-80 xl:w-96 shrink-0 bg-msgr-surface-container-low border-e border-stone-100 flex flex-col">
             <div className="p-8 pb-4">
                <h3 className="font-headline text-2xl font-black italic tracking-tighter uppercase mb-6">{t('messenger.messages')}</h3>
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                     <Search className="size-4 text-zinc-400 group-focus-within:text-msgr-primary transition-colors" />
                   </div>
                   <input 
                      type="text" 
                      placeholder={t('messenger.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-stone-100 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-msgr-primary/5 focus:border-msgr-primary/20 transition-all shadow-sm placeholder-zinc-400"
                   />
                   {searchQuery && (
                     <button 
                       onClick={() => setSearchQuery('')}
                       className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                     >
                       <X className="size-3.5" />
                     </button>
                   )}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
                {filteredConversations.map(conv => {
                   const pId = conv.participants.find(id => id !== currentUser.uid);
                   const partner = pId ? partnersData[pId] : null;
                   const isActive = selectedConvId === conv.id;
                   const isTyping = pId && conv.typing?.[pId];
                   const unread = conv.unreadCount?.[currentUser?.uid || ''] || 0;

                   return (
                     <div 
                       key={conv.id}
                       onClick={() => setSearchParams({ id: conv.id })}
                       className={clsx(
                         "flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer relative",
                         isActive ? "bg-msgr-surface-container-highest shadow-sm" : "hover:bg-msgr-surface-container-high"
                       )}
                     >
                        {isActive && <div className="absolute inset-s-0 top-4 bottom-4 w-1 bg-msgr-primary rounded-e-full" />}
                        
                        <div className="relative shrink-0">
                           <img 
                             src={partner?.photoURL || `https://ui-avatars.com/api/?name=${partner?.userCode || partner?.displayName || '?'}`} 
                             className="w-12 h-12 rounded-2xl object-cover shadow-sm" 
                             alt="" 
                           />
                           {partner?.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#007440] border-2 border-msgr-surface-container-low rounded-full" />}
                        </div>

                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-[13px] font-black italic tracking-tight uppercase truncate">{partner?.userCode || partner?.displayName || conv.name || 'Unknown'}</span>
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                {conv.updatedAt ? format(conv.updatedAt.toMillis?.() || conv.updatedAt.seconds * 1000, 'h:mm a') : ''}
                              </span>
                           </div>
                           <p className={clsx("text-[11px] truncate", unread > 0 ? "font-black text-zinc-900" : "text-zinc-500")}>
                             {isTyping ? (
                               <span className="text-msgr-primary font-black italic">Typing...</span>
                             ) : (
                               conv.lastMessage?.text || 'No messages'
                             )}
                           </p>
                        </div>
                        {unread > 0 && <div className="size-2 bg-msgr-primary rounded-full animate-pulse" />}
                     </div>
                   );
                })}
             </div>
          </section>

          {/* 💬 Chat Main Area */}
          <section className="flex-1 flex flex-col bg-[#faf9f6]">
             {selectedConvId || (selectedPartner && selectedConvId === 'new') ? (
               <ChatWindow 
                 conversationId={selectedConvId || 'new'}
                 currentUser={currentUser}
                 userData={userData}
                 partner={selectedPartner}
                 onBack={() => setSearchParams({})}
                 simplified={true}
               />
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-msgr-primary shadow-2xl mb-10 border border-zinc-50">
                     <span className="material-symbols-outlined text-5xl">forum</span>
                  </div>
                  <h2 className="text-3xl font-black italic font-headline uppercase tracking-tighter mb-4">Select a Thread</h2>
                  <p className="text-zinc-400 text-sm max-w-sm font-medium leading-relaxed">
                     Enter a secure clinical conversation thread or initiate a new expert consult above.
                  </p>
               </div>
             )}
          </section>

          {/* 📂 Case Sidebar (Right) */}
          <aside className="w-80 shrink-0 bg-white border-s border-stone-100 hidden 2xl:flex flex-col p-8 overflow-y-auto custom-scrollbar">
             <h3 className="font-headline text-lg font-black italic uppercase tracking-tighter mb-8">Case Context</h3>
             
             <div className="space-y-8">
                <div className="p-6 bg-msgr-primary/5 rounded-3xl border border-msgr-primary/10">
                   <p className="text-[9px] font-black text-msgr-primary uppercase tracking-[0.2em] mb-2">Active File</p>
                   <h6 className="text-[13px] font-bold text-zinc-900 leading-tight mb-2">Nexus_Strategic_Brief_V4.pdf</h6>
                   <p className="text-[10px] text-zinc-400 font-medium">Modified 2 hours ago by Lead Expert</p>
                   <button onClick={() => navigate('/clinical-workstation')} className="mt-6 w-full py-3 bg-msgr-primary-container/10 text-msgr-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-msgr-primary-container/20 transition-all">
                      Open Workspace
                   </button>
                </div>

                <div>
                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Participants</p>
                   <div className="space-y-4">
                      {selectedPartner && (
                        <div className="flex items-center gap-3">
                           <img src={selectedPartner.photoURL} className="w-10 h-10 rounded-xl object-cover" />
                           <div>
                              <p className="text-xs font-black italic uppercase tracking-tight">{selectedPartner.userCode || selectedPartner.displayName}</p>
                              <p className="text-[9px] font-bold text-[#007440] uppercase px-1.5 py-0.5 bg-emerald-50 rounded-md inline-block">Online</p>
                           </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                         <img src={currentUser?.photoURL} className="w-10 h-10 rounded-xl object-cover" />
                         <div>
                            <p className="text-xs font-black italic uppercase tracking-tight">{currentUser?.displayName} (You)</p>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase">Self</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-zinc-100">
                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Shared Assets</p>
                   <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-6 text-center">
                     <span className="material-symbols-outlined text-zinc-300 text-3xl mb-2">folder_off</span>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Vault Empty</p>
                     <p className="text-[9px] text-zinc-400 mt-1">Shared assets feature coming soon.</p>
                   </div>
                </div>
             </div>
          </aside>
       </div>

       {isNewMessageModalOpen && currentUser && (
          <NewMessageModal
            currentUserId={currentUser.uid}
            onClose={() => setIsNewMessageModalOpen(false)}
            onSuccess={(convId, pData) => {
              setIsNewMessageModalOpen(false);
              if (convId === 'new') {
                setSelectedPartner(pData as ParticipantData);
                setSearchParams({ id: 'new', partnerId: pData.uid });
              } else {
                setSearchParams({ id: convId });
              }
            }}
          />
        )}
    </div>
  );
};

export default Messenger;
