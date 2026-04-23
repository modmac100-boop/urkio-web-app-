import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { Search, Users, Shield, MessageSquare, Plus, X, Check, Loader2 } from 'lucide-react';
import { CreateGroupModal } from './CreateGroupModal';
import { NewMessageModal } from './NewMessageModal';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Conversation {
  id: string;
  participants: string[];
  type?: 'individual' | 'group' | 'circle';
  name?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
    type?: string;
    read?: boolean;
  };
  unreadCount?: Record<string, number>;
  updatedAt: any;
}

interface ParticipantData {
  uid: string;
  displayName: string;
  photoURL: string;
  isOnline?: boolean;
}

export function ConversationList({ 
  currentUserId, 
  onSelectConversation, 
  activeConversationId,
  onNewMessage,
  tabFilter = 'all'
}: { 
  currentUserId: string;
  onSelectConversation: (conversationId: string, partner: ParticipantData) => void;
  activeConversationId?: string;
  onNewMessage?: () => void;
  tabFilter?: 'all' | 'video' | 'groups' | 'files';
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnersData, setPartnersData] = useState<Record<string, ParticipantData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'circle' | 'groups'>('all');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const fetchedPartnersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUserId)
      // Removed orderBy('updatedAt', 'desc') to bypass missing index requirement
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      
      // Sort in-memory instead of Firestore
      convs.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds * 1000 || 0;
        const timeB = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds * 1000 || 0;
        return timeB - timeA;
      });

      setConversations(convs);
      setLoading(false);

      // Fetch missing partner data efficiently without re-fetching existing ones
      const missingIds: string[] = [];
      for (const conv of convs) {
        if (conv.type === 'individual' || !conv.type) {
          const partnerId = conv.participants.find(id => id !== currentUserId);
          if (partnerId && !fetchedPartnersRef.current.has(partnerId)) {
            missingIds.push(partnerId);
            fetchedPartnersRef.current.add(partnerId);
          }
        }
      }

      if (missingIds.length > 0) {
        Promise.all(missingIds.map(async (partnerId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', partnerId));
            if (userDoc.exists()) {
              setPartnersData(prev => ({
                ...prev,
                [partnerId]: { uid: partnerId, ...userDoc.data() } as ParticipantData
              }));
            }
          } catch (error) {
            console.error(`Error fetching partner ${partnerId}:`, error);
          }
        }));
      }
    }, (error) => {
      console.error("Firestore Error in ConversationList:", error);
      setLoading(false);
      // If it's an index error, provide a specific warning in console for developers
      if (error.code === 'failed-precondition') {
        console.error("Missing Index: Query requires a composite index. Check the link in the error message.");
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const filteredConversations = conversations.filter(conv => {
    // 1. Sidebar Category Filter (tabFilter)
    const matchesTab = (() => {
        if (tabFilter === 'all') return true;
        if (tabFilter === 'groups') return conv.type === 'group' || conv.type === 'circle';
        if (tabFilter === 'video') return conv.lastMessage?.type === 'call' || conv.lastMessage?.type === 'video';
        if (tabFilter === 'files') return conv.lastMessage?.type === 'file' || conv.lastMessage?.type === 'video' || conv.lastMessage?.type === 'audio' || conv.lastMessage?.type === 'image';
        return true;
    })();

    if (!matchesTab) return false;

    // 2. Internal Quick Tab Filter (activeFilter)
    const isMatchingFilter = 
      activeFilter === 'all' || 
      (activeFilter === 'circle' && conv.type === 'circle') || 
      (activeFilter === 'groups' && conv.type === 'group');
    
    if (!isMatchingFilter) return false;

    // 3. Search Query Filter
    if (!searchQuery) return true;

    if (conv.type === 'individual' || !conv.type) {
      const partnerId = conv.participants.find(id => id !== currentUserId);
      const partner = partnerId ? partnersData[partnerId] : null;
      return partner?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return conv.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  return (
    <div className="flex flex-col h-full bg-transparent w-full">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('messaging.chats')}</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">{filteredConversations.length} Active Sessions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            const searchInput = document.getElementById('chat-search');
            searchInput?.focus();
          }} className="size-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:text-primary shadow-sm border border-slate-100 dark:border-slate-700 transition-all">
            <Search className="size-4" />
          </button>
          <button onClick={() => setShowNewMessage(true)} className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
            <Plus className="size-5" />
          </button>
          <button onClick={() => setShowCreateGroup(true)} className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" title="Create Group">
             <Users className="size-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="relative flex items-center">
          <Search className="absolute is-3 size-4 text-slate-400" />
          <input
            id="chat-search"
            type="text"
            placeholder={t('messaging.searchConversations')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ltr:pl-9 rtl:pr-9 ltr:pr-4 rtl:pl-4 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white placeholder:text-slate-400 shadow-sm"
          />
        </div>
      </div>

      {/* Minimalist Tabs */}
      <div className="ps-6 pe-6 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: t('messaging.filterAll') },
            { id: 'circle', label: t('messaging.filterCircle') || 'Circle' },
            { id: 'groups', label: t('messaging.filterGroups') }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={clsx(
                "pb-3 text-sm transition-all whitespace-nowrap",
                activeFilter === filter.id 
                  ? "font-bold text-primary border-b-2 border-primary"
                  : "font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border-b-2 border-transparent"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-2 pt-4 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="size-8 text-primary animate-spin mb-4" />
            <p className="text-sm text-slate-500 font-medium animate-pulse">Syncing Channels...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center animate-in fade-in duration-500">
            <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="size-8 opacity-40 text-slate-400" />
            </div>
            <p className="text-sm font-medium">{t('messaging.noChats')}</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const partnerId = conv.participants.find(id => id !== currentUserId);
            const partner: any = (conv.type === 'individual' || !conv.type) 
              ? (partnerId ? partnersData[partnerId] : null)
              : { displayName: conv.name, photoURL: '', uid: conv.id };
            
            if (!partner) return null;

            const isIndividual = conv.type === 'individual' || !conv.type;
            const lastMsgTime = conv.lastMessage?.timestamp?.toMillis?.() || Date.now();
            const isActive = activeConversationId === conv.id;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id, partner)}
                className={clsx(
                  "w-full text-start p-3.5 rounded-2xl flex items-center gap-4 group transition-all duration-300",
                  isActive 
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                    : "bg-white dark:bg-slate-800/80 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md hover:border-primary/30"
                )}
              >
                <div className="relative shrink-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isIndividual && partner?.uid) {
                        navigate(`/user/${partner.uid}`);
                      }
                    }}
                    className="focus:outline-none group/conv-avatar block cursor-pointer"
                    title={isIndividual ? `View ${partner.displayName}'s profile` : ''}
                  >
                    <img 
                      src={partner.photoURL || (isIndividual ? `https://ui-avatars.com/api/?name=${partner.displayName}&background=${isActive ? 'ffffff' : '136dec'}&color=${isActive ? '136dec' : 'fff'}` : `https://ui-avatars.com/api/?name=G&background=6366f1&color=fff` )}
                      alt={partner.displayName}
                      className="size-12 rounded-full object-cover shadow-sm group-hover/conv-avatar:ring-2 group-hover/conv-avatar:ring-white/50 transition-all duration-300"
                    />
                  </div>
                  {isIndividual && partner.isOnline && (
                    <div className="absolute -bottom-1 -inset-e-1 size-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={clsx(
                      "font-bold text-[15px] truncate pe-2",
                      isActive ? "text-white" : "text-slate-900 dark:text-white"
                    )}>
                      {partner.displayName}
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                        <span className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wider",
                        isActive 
                            ? "bg-white/20 text-white" 
                            : "text-primary bg-primary/10"
                        )}>
                        {formatDistanceToNow(lastMsgTime, { addSuffix: false })}
                        </span>
                        {conv.unreadCount?.[currentUserId] ? (
                            <span className="size-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-in zoom-in">
                                {conv.unreadCount[currentUserId] > 9 ? '9+' : conv.unreadCount[currentUserId]}
                            </span>
                        ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 w-full overflow-hidden">
                    {conv.lastMessage?.senderId === currentUserId && (
                      <span className={clsx(
                        "material-symbols-outlined text-[16px] shrink-0",
                        isActive ? "text-white/80" : (conv.lastMessage.read ? "text-blue-500 font-bold" : "text-slate-400")
                      )}>
                        {conv.lastMessage.read ? 'done_all' : 'done'}
                      </span>
                    )}
                    <p className={clsx(
                      "text-[13px] truncate font-medium",
                      isActive ? "text-white/90" : "text-slate-500 dark:text-slate-400"
                    )}>
                      {conv.lastMessage?.text || t('messaging.tapToChat')}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {showCreateGroup && (
        <CreateGroupModal 
          onClose={() => setShowCreateGroup(false)} 
          currentUserId={currentUserId}
          onSuccess={(conversationId, groupData) => {
            setShowCreateGroup(false);
            onSelectConversation(conversationId, groupData as any);
          }}
        />
      )}

      {showNewMessage && (
        <NewMessageModal 
          onClose={() => setShowNewMessage(false)} 
          currentUserId={currentUserId}
          onSuccess={(conversationId, userData) => {
            setShowNewMessage(false);
            onSelectConversation(conversationId, userData as any);
          }}
        />
      )}
    </div>
  );
}

