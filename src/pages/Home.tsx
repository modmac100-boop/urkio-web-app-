import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, where, updateDoc, doc, arrayUnion, arrayRemove, increment, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { EmojiPicker } from '../components/EmojiPicker';
import { CreateEventModal } from '../components/CreateEventModal';
import { ArticleCreatorModal } from '../components/profile/ArticleCreatorModal';
import { UpcomingNowBanner } from '../components/UpcomingNowBanner';
import { PostCreator } from '../components/profile/PostCreator';
import { FeedPost } from '../components/profile/FeedPost';
import { GoLiveModal } from '../components/GoLiveModal';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { AnimatePresence } from 'framer-motion';
import { OnlinePresenceHome } from '../components/OnlinePresenceHome';
import { InteractionsModal } from '../components/InteractionsModal';
import { BookSessionModal } from '../components/BookSessionModal';
import { SessionAd } from '../components/SessionAd';
import { 
  Plus, 
  Search, 
  Bell, 
  Calendar, 
  Clock, 
  ChevronRight, 
  MapPin, 
  Star, 
  Shield,
  Loader2,
  Flame, 
  TrendingUp, 
  Users, 
  MoreHorizontal,
  Share2,
  Heart,
  MessageCircle,
  HelpCircle,
  Stethoscope,
  HeartPulse,
  Brain,
  Sprout,
  Compass,
  Zap,
  CheckCircle2,
  Award,
  Video,
  Play
} from 'lucide-react';

export function Home({ user, userData }: { user: any, userData: any }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const location = useLocation();
  const role = userData?.role?.toLowerCase();
  const isSpecialRole = 
    (role && ['specialist', 'expert', 'case_manager', 'admin', 'management', 'manager', 'verifiedexpert', 'practitioner'].includes(role)) || 
    user?.email?.includes('urkio') || 
    user?.email === 'sameralhalaki@gmail.com' ||
    user?.email === 'banason150@gmail.com';
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  
  // Media upload state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  // New state for Sessions
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showComingSoonInfo, setShowComingSoonInfo] = useState(false);

  // Post interaction state
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [repostingId, setRepostingId] = useState<string | null>(null);
  const [shareMenuPostId, setShareMenuPostId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [isInteractionsModalOpen, setIsInteractionsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedExpertForBooking, setSelectedExpertForBooking] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [postMenuId, setPostMenuId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      setMediaFile(file);
      setMediaType(isVideo ? 'video' : 'image');
      setMediaPreview(URL.createObjectURL(file));
      toast.success(isVideo ? 'Video selected' : 'Image selected');
    }
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s global timeout

      // Parallel fetch with individual error handling and inner timeouts
      const fetchPosts = async () => {
        try {
          const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(15));
          const postsSnap = await getDocs(postsQuery);
          const postsData = postsSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() as any }))
            .filter(post => !post.circleId)
            .slice(0, 10);
          setRecentPosts(postsData);
        } catch (error) {
          console.error("Error fetching recent posts:", error);
        }
      };

      try {
        await Promise.race([
          fetchPosts(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5500))
        ]);
      } catch (error) {
        console.warn("General timeout or error in home data fetch:", error);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    const now = new Date().toISOString();
    const q = query(
      collection(db, 'events'),
      where('date', '>=', now),
      orderBy('date', 'asc'),
      limit(5)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("[Home] Real-time sessions update:", sessions.length);
      setUpcomingSessions(sessions);
      if (sessions.length > 0) {
        setCurrentSpotlightIndex(0);
      }
    }, (error) => {
      console.error("Error listening to sessions:", error);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (upcomingSessions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSpotlightIndex(prev => (prev + 1) % upcomingSessions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [upcomingSessions.length]);

  const handlePost = async () => {
    if (!postContent.trim() && !mediaFile) return;
    setIsPosting(true);
    try {
      let mediaUrl = '';
      if (mediaFile) {
        const mediaRef = ref(storage, `posts/${user.uid}/${Date.now()}_${mediaFile.name}`);
        const snapshot = await uploadBytes(mediaRef, mediaFile);
        mediaUrl = await getDownloadURL(snapshot.ref);
      }

      const newPost: any = {
        content: postContent,
        authorId: user.uid,
        authorName: userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User',
        authorPhoto: userData?.photoURL || user?.photoURL || null,
        authorRole: userData?.role || 'user',
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
      };

      if (mediaUrl) {
        newPost.mediaUrl = mediaUrl;
        newPost.mediaType = mediaType;
      }

      const docRef = await addDoc(collection(db, 'posts'), newPost);
      setRecentPosts([{ id: docRef.id, ...newPost, createdAt: new Date() }, ...recentPosts]);

      // Reset state
      setPostContent('');
      setShowComposer(false);
      setMediaFile(null);
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
      setMediaType(null);
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleRemindMe = (event: any) => {
    toast.success(`Reminder set for "${event.title}"!`);
    console.log(`Set reminder for event: ${event.title} on ${new Date(event.date).toLocaleString()}`);
  };

  // ── Post interaction handlers ──────────────────────────────────────────────

  const handleLike = async (postId: string) => {
    if (!user) return toast.error('Please sign in to like posts.');
    const alreadyLiked = likedPosts.has(postId);
    // Optimistic UI
    setLikedPosts(prev => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    const userPhoto = userData?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName || 'U')}`;
    
    setRecentPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { 
              ...p, 
              likesCount: Math.max(0, (p.likesCount || 0) + (alreadyLiked ? -1 : 1)),
              recentLikerPhotos: alreadyLiked 
                ? (p.recentLikerPhotos || []).filter(ph => ph !== userPhoto)
                : [userPhoto, ...(p.recentLikerPhotos || [])].slice(0, 3)
            }
          : p
      )
    );

    try {
      await updateDoc(doc(db, 'posts', postId), {
        likesCount: increment(alreadyLiked ? -1 : 1),
        likedBy: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        recentLikerPhotos: alreadyLiked 
          ? arrayRemove(userPhoto) 
          : arrayUnion(userPhoto)
      });
      toast.success(alreadyLiked ? t('home.insightRemoved') : t('home.insightShared'));
    } catch (e) {
      // Revert on error
      setLikedPosts(prev => { const next = new Set(prev); alreadyLiked ? next.add(postId) : next.delete(postId); return next; });
      toast.error(t('common.error'));
    }
  };

  const handleRepost = async (post: any) => {
    if (!user) return toast.error(t('auth.noAccount'));
    setRepostingId(post.id);
    try {
      await addDoc(collection(db, 'posts'), {
        content: post.content,
        authorId: user.uid,
        authorName: userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User',
        authorPhoto: userData?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${user.email || 'U'}`,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        repostOf: { authorName: post.authorName, authorId: post.authorId },
        ...(post.mediaUrl ? { mediaUrl: post.mediaUrl, mediaType: post.mediaType } : {}),
      });
      await updateDoc(doc(db, 'posts', post.id), { 
        repostCount: increment(1),
        repostsCount: increment(1) 
      });
      toast.success(t('home.reposted'));
    } catch (e) {
      toast.error('Failed to repost.');
    } finally {
      setRepostingId(null);
    }
  };

  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t('specialistHub.copied'));
    }).catch(() => toast.error(t('common.error')));
    setShareMenuPostId(null);
  };

  const handleNativeShare = async (post: any) => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Post by ${post.authorName}`, text: post.content?.slice(0, 100), url });
      } catch (_) { /* user dismissed */ }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied! 🔗');
    }
    setShareMenuPostId(null);
  };

  const toggleComments = async (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
    if (!postComments[postId]) {
      try {
        const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'), limit(20));
        const snap = await getDocs(q);
        setPostComments(prev => ({ ...prev, [postId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
      } catch (e) { /* no comments yet */ }
    }
  };

  const handleSubmitComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !user) return;
    setSubmittingComment(postId);
    try {
      const commentRef = await addDoc(collection(db, 'posts', postId, 'comments'), {
        content: text,
        postId: postId,
        authorId: user.uid,
        authorName: userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User',
        authorPhoto: userData?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${user.email || 'U'}`,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
      const newComment = { id: commentRef.id, content: text, authorName: userData?.displayName || 'You', authorPhoto: userData?.photoURL || null, createdAt: new Date() };
      setPostComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
      setRecentPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (e) {
      toast.error('Failed to post comment.');
    } finally {
      setSubmittingComment(null);
    }
  };

  // Close share menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuPostId(null);
        setPostMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleOpenBooking = (e: any) => {
      if (e.detail) {
        setSelectedExpertForBooking(e.detail);
        setIsBookingModalOpen(true);
      }
    };
    window.addEventListener('open-booking-modal', handleOpenBooking);
    return () => window.removeEventListener('open-booking-modal', handleOpenBooking);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-ur-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm(t('home.confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setRecentPosts(prev => prev.filter(p => p.id !== postId));
      toast.success(t('common.save'));
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
    setPostMenuId(null);
  };

  const handleStartEdit = (post: any) => {
    setEditingPostId(post.id);
    setEditText(post.content);
    setPostMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPostId || !editText.trim()) return;
    try {
      await updateDoc(doc(db, 'posts', editingPostId), { content: editText });
      setRecentPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, content: editText } : p));
      setEditingPostId(null);
      toast.success('Post updated');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const handleCopyPost = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success(t('specialistHub.copied'));
    });
    setPostMenuId(null);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'events', eventId));
      setUpcomingSessions(prev => prev.filter(e => e.id !== eventId));
      setSelectedEvent(null);
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const spotlightEvent = upcomingSessions[currentSpotlightIndex];

  return (
    <div className="space-y-6 pb-6">
      {/* Stories / Online Presence at the very top */}
      <OnlinePresenceHome user={user} />
      
      {/* Hero / Spotlight Section */}
        {/* Expert Spotlight Banner (Hero) */}
        {spotlightEvent ? (
          <div 
            onClick={() => setSelectedEvent(spotlightEvent)}
            className="relative h-[300px] md:h-[360px] rounded-2xl md:rounded-4xl overflow-hidden group cursor-pointer shadow-xl transition-all duration-700 hover:shadow-ur-primary/20"
          >
            {spotlightEvent.mediaUrl && (spotlightEvent.mediaUrl.includes('.webm') || spotlightEvent.mediaUrl.includes('.mp4')) ? (
              <video 
                src={spotlightEvent.mediaUrl} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                autoPlay 
                muted 
                loop 
                playsInline 
                preload="auto"
              />
            ) : (
              <img 
                src={spotlightEvent.mediaUrl || spotlightEvent.creatorPhoto || `https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop`} 
                alt="Spotlight" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-900/40 to-transparent"></div>
            
            <div className="absolute top-6 inset-s-6 md:top-10 md:inset-s-10 flex items-center gap-3">
              <div className="px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-1.5">
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-ur-primary animate-pulse"></div>
                <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-[0.2em]">{t('home.spotlight')}</span>
              </div>
            </div>

            <div className="absolute bottom-8 inset-s-8 md:bottom-12 md:inset-s-12 inset-e-8 md:inset-e-12">
              <p className="text-ur-primary dark:text-blue-400 font-headline font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] mb-2 md:mb-3">{t('home.expertPractitionerSeries')}</p>
              <h1 className="text-2xl md:text-3xl font-headline font-black text-white mb-2 md:mb-4 leading-[1.1] tracking-tight group-hover:text-ur-primary transition-colors duration-500 line-clamp-2">
                {spotlightEvent.title}
              </h1>
              <p className="hidden sm:block text-zinc-300 text-xs font-semibold max-w-lg mb-6 md:mb-8 leading-relaxed line-clamp-2">
                {spotlightEvent.description || t('home.defaultSpotlightDesc')}
              </p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(spotlightEvent);
                  }}
                  className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-ur-primary text-white rounded-lg md:rounded-xl font-headline font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-white hover:text-ur-primary hover:scale-[1.02] transition-all active:scale-95"
                >
                  {t('home.registerNow')}
                </button>
                <div className="flex items-center gap-3 text-white/60">
                  <span className="material-symbols-outlined text-xl">group</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{spotlightEvent.attendeesCount || 24} {t('home.registered')}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
        <div 
          onClick={() => setShowComingSoonInfo(true)}
          className="h-[480px] rounded-[3rem] bg-zinc-900 flex flex-col items-center justify-center text-center p-12 border border-zinc-800 cursor-pointer group relative overflow-hidden transition-all duration-500 hover:border-ur-primary/40 hover:shadow-2xl"
        >
          <div className="absolute inset-0 bg-linear-to-br from-ur-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative z-10 flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl text-zinc-700 group-hover:text-ur-primary group-hover:scale-110 transition-all duration-500 mb-6 italic">star_half</span>
            <h2 className="text-3xl font-headline font-black text-white mb-4 group-hover:translate-y-[-4px] transition-transform duration-500">{t('home.newSessionsComingSoon')}</h2>
            <p className="text-zinc-500 max-w-md font-medium group-hover:text-zinc-400 transition-colors duration-500">{t('home.newSessionsComingSoonDesc')}</p>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-ur-primary uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
              <span>{t('home.clickForMoreInfo')}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>
        </div>
        )}

        {/* Instant Action Bar */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <Link
            to="/therapy-room"
            className="flex-1 group relative overflow-hidden bg-zinc-950 dark:bg-zinc-100 p-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl border border-zinc-800 dark:border-white/20"
          >
            <div className="absolute top-0 inset-e-0 w-32 h-32 bg-ur-primary/20 blur-3xl rounded-full" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-ur-primary/10 flex items-center justify-center border border-ur-primary/20">
                  <Video className="w-7 h-7 text-ur-primary" />
                </div>
                <div>
                  <h3 className="text-white dark:text-zinc-900 font-headline font-black text-lg tracking-tight">{t('nav.instantCall')}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{t('home.liveSession')}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 dark:bg-black/5 flex items-center justify-center group-hover:bg-ur-primary/20 transition-colors">
                <ChevronRight className={clsx("w-5 h-5 text-zinc-500 group-hover:text-ur-primary transition-transform", isRTL ? "rotate-180" : "")} />
              </div>
            </div>
          </Link>
        </div>

        {/* Post Creator Section */}
        {user && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex gap-4 items-start">
              <img src={userData?.photoURL || user.photoURL} alt="Me" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
              <div className="flex-1 space-y-3">
                <textarea 
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={t('home.composerPlaceholder')}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border-none text-on-surface font-headline font-bold text-sm p-0 focus:ring-0 resize-none min-h-[40px] placeholder:text-zinc-400"
                ></textarea>

                {mediaPreview && (
                  <div className="relative inline-block w-full max-w-xs">
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} controls className="max-h-64 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-black w-full object-contain" />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="max-h-64 rounded-xl border border-zinc-100 dark:border-zinc-800 object-contain w-full" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMediaFile(null);
                        if (mediaPreview) URL.revokeObjectURL(mediaPreview);
                        setMediaPreview(null);
                        setMediaType(null);
                      }}
                      className="absolute -top-3 -inset-e-3 p-1.5 bg-white text-zinc-500 rounded-full shadow-md hover:bg-zinc-50 transition-colors border border-zinc-100 z-10"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-6 border-t border-zinc-50 dark:border-zinc-800">
                  <div className="flex gap-8">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleMediaPick}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="flex items-center gap-2.5 text-zinc-500 hover:text-ur-primary transition-colors group"
                    >
                      <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">add_a_photo</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] hidden sm:inline">{t('mediaHub.images')}</span>
                    </button>
                    <button onClick={() => setIsEventModalOpen(true)} className="flex items-center gap-2.5 text-zinc-500 hover:text-ur-primary transition-colors group">
                      <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">event_available</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] hidden sm:inline">{t('home.createEvent')}</span>
                    </button>
                    <button onClick={() => setIsArticleModalOpen(true)} className="flex items-center gap-2.5 text-zinc-500 hover:text-ur-primary transition-colors group">
                      <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">article</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] hidden sm:inline">{t('home.article')}</span>
                    </button>
                  </div>
                  <button 
                    onClick={handlePost}
                    disabled={(!postContent.trim() && !mediaFile) || isPosting}
                    className="px-6 py-2 milled-gradient text-white rounded-lg font-headline font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isPosting ? t('home.posting') : t('home.postNow')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feed Filters */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-4">
            <button className="px-6 py-2.5 bg-ur-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-ur-primary/20">{t('home.recent')}</button>
            <button className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors">{t('home.relevant')}</button>
          </div>
          <button className="text-zinc-400 hover:text-ur-primary transition-all">
            <span className="material-symbols-outlined text-xl">tune</span>
          </button>
        </div>

        {/* Session Ads / Promoted Events */}
        {upcomingSessions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">{t('home.promotedSessions')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {upcomingSessions.slice(0, 2).map(session => (
                <SessionAd 
                  key={session.id} 
                  event={session} 
                  onClick={setSelectedEvent} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Feed Feed */}
        <div className="space-y-6">
          {recentPosts.map((post) => (
            <FeedPost 
              key={post.id} 
              post={post} 
              user={userData} 
              isRTL={isRTL} 
              currentUserId={user?.uid} 
            />
          ))}
        </div>


      {/* Modals */}
      <ArticleCreatorModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        user={user}
        userData={userData}
        onArticleCreated={(newArticle) => setRecentPosts(prev => [newArticle, ...prev])}
      />

      <CreateEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        user={user} 
        userData={userData} 
      />
      
      <GoLiveModal 
        isOpen={isLiveModalOpen} 
        onClose={() => setIsLiveModalOpen(false)} 
        user={user} 
        userData={userData} 
      />

      <InteractionsModal
        isOpen={isInteractionsModalOpen}
        onClose={() => setIsInteractionsModalOpen(false)}
        postId={selectedPostId || ''}
        currentUserId={user?.uid}
      />

      <AnimatePresence>
        {selectedEvent && (
          <EventDetailsModal
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
            user={user}
            userData={userData}
            handleDeleteEvent={handleDeleteEvent}
          />
        )}
        
        {isBookingModalOpen && selectedExpertForBooking && (
          <BookSessionModal 
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            expert={selectedExpertForBooking}
            user={user}
            userData={userData}
          />
        )}
        
        {showComingSoonInfo && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
              onClick={() => setShowComingSoonInfo(false)}
            ></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-zinc-100 dark:border-zinc-800">
              <div className="h-48 bg-ur-primary relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 inset-s-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                </div>
                <span className="material-symbols-outlined text-7xl text-white font-fill relative z-10">architecture</span>
              </div>
              <div className="p-12">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-headline font-black text-on-surface dark:text-zinc-100 mb-2">Curating Excellence</h3>
                    <p className="text-[10px] font-black text-ur-primary uppercase tracking-[0.2em]">Upcoming Workshop Series</p>
                  </div>
                  <button 
                    onClick={() => setShowComingSoonInfo(false)}
                    className="p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl hover:bg-zinc-200 transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="space-y-8">
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                    Our team is currently finalizing the schedules for our next batch of high-impact architectural and healing workshops. These sessions are designed to merge clinical precision with design excellence.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="w-10 h-10 rounded-xl bg-ur-primary/10 flex items-center justify-center text-ur-primary mb-4">
                        <span className="material-symbols-outlined">psychology</span>
                      </div>
                      <h4 className="font-bold text-sm mb-2 text-on-surface dark:text-zinc-200">Healing Spaces</h4>
                      <p className="text-xs text-zinc-500">Exploring the psychological impact of clinical environments.</p>
                    </div>
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 mb-4">
                        <span className="material-symbols-outlined">foundation</span>
                      </div>
                      <h4 className="font-bold text-sm mb-2 text-on-surface dark:text-zinc-200">Executive Design</h4>
                      <p className="text-xs text-zinc-500">Advanced workshops on structural integrity and aesthetics.</p>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900"></div>
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">12+ Experts Joining</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          setShowComingSoonInfo(false);
                          setIsEventModalOpen(true);
                        }}
                        className="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Plus size={14} /> Launch New Session
                      </button>
                      <button 
                        onClick={() => setShowComingSoonInfo(false)}
                        className="px-8 py-3 bg-ur-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        Notify Me
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
