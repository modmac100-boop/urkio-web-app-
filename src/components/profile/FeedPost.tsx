import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Eye, Repeat, Archive, Send, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { InteractionsModal } from '../InteractionsModal';
import { CommentsSection } from './CommentsSection';
import { db } from '../../firebase';
import { 
  doc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedPostProps {
  post: any;
  user?: any;
  isRTL?: boolean;
  currentUserId?: string;
  onBookClick?: (expert: any) => void;
}

const REACTIONS = [
  { emoji: '❤️', label: 'Love', color: 'text-rose-500' },
  { emoji: '👍', label: 'Like', color: 'text-blue-500' },
  { emoji: '🔥', label: 'Hot', color: 'text-orange-500' },
  { emoji: '👏', label: 'Clap', color: 'text-yellow-500' },
  { emoji: '😮', label: 'Wow', color: 'text-purple-500' },
  { emoji: '😂', label: 'Haha', color: 'text-yellow-400' },
  { emoji: '🧠', label: 'Insight', color: 'text-indigo-400' },
  { emoji: '🙏', label: 'Pray', color: 'text-emerald-500' },
  { emoji: '😢', label: 'Sad', color: 'text-blue-400' },
  { emoji: '😡', label: 'Angry', color: 'text-red-500' },
  { emoji: '💯', label: 'Perfect', color: 'text-orange-600' },
  { emoji: '✨', label: 'Magic', color: 'text-purple-400' },
  { emoji: '🚀', label: 'Rocket', color: 'text-cyan-500' },
  { emoji: '💎', label: 'Value', color: 'text-blue-300' },
  { emoji: '💡', label: 'Idea', color: 'text-yellow-500' },
  { emoji: '🤝', label: 'Respect', color: 'text-amber-600' },
];

export function FeedPost({ post, user, isRTL, currentUserId }: FeedPostProps) {
  const [isInteractionsModalOpen, setIsInteractionsModalOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [userReaction, setUserReaction] = useState<string | null>(
    post.reactions?.[currentUserId || ''] || (post.likedBy?.includes(currentUserId) ? '❤️' : null)
  );
  const [repostsCount, setRepostsCount] = useState(post.repostCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [postContentText, setPostContentText] = useState(post.content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const reactionTimeoutRef = useRef<any>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const authorName = post.authorName || 'Urkio User';
  const authorAvatar = post.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}`;
  const timeAgo = post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate()) + ' ago' : 'Recently';

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return toast.error('Please sign in to react.');
    
    const isRemoving = userReaction === emoji;
    const oldReaction = userReaction;
    
    // Optimistic update
    setUserReaction(isRemoving ? null : emoji);
    if (isRemoving) {
      setLikesCount(prev => Math.max(0, prev - 1));
    } else if (!oldReaction) {
      setLikesCount(prev => prev + 1);
    }

    setShowReactionPicker(false);

    try {
      const postRef = doc(db, 'posts', post.id);
      const updates: any = {
        [`reactions.${currentUserId}`]: isRemoving ? null : emoji,
        likesCount: increment(isRemoving ? -1 : (!oldReaction ? 1 : 0))
      };

      if (isRemoving) {
        updates.likedBy = arrayRemove(currentUserId);
      } else {
        updates.likedBy = arrayUnion(currentUserId);
      }

      await updateDoc(postRef, updates);
      if (!isRemoving) toast.success(`${emoji} Reaction added!`);
    } catch (err) {
      console.error('Reaction error:', err);
      setUserReaction(oldReaction);
      setLikesCount(prev => post.likesCount || 0);
      toast.error('Could not update reaction.');
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userReaction) {
      handleReaction(userReaction);
    } else {
      handleReaction('❤️');
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return toast.error('Please sign in to spread.');
    setRepostsCount(prev => prev + 1);
    try {
      await addDoc(collection(db, 'posts'), {
        content: post.content,
        authorId: currentUserId,
        authorName: 'You',
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        repostOf: { authorName: authorName, authorId: post.authorId },
        ...(post.mediaUrl ? { mediaUrl: post.mediaUrl, mediaType: post.mediaType } : {}),
      });
      await updateDoc(doc(db, 'posts', post.id), { repostCount: increment(1) });
      toast.success('Spread successfully! 🔁');
    } catch (err) {
      setRepostsCount(prev => prev - 1);
      toast.error('Failed to spread.');
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from archive' : 'Added to archive', { icon: '🔖' });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      toast.success('Post deleted');
      window.location.reload(); 
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    try {
      await updateDoc(doc(db, 'posts', post.id), { content: editText });
      setIsEditing(false);
      setPostContentText(editText);
      toast.success('Post updated');
    } catch (err) {
      toast.error('Failed to update post');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postContentText).then(() => {
      toast.success('Post copied! 📝');
    });
    setIsMenuOpen(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Post by ${authorName}`, text: postContentText?.slice(0, 100), url });
      } catch (_) { }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied! 🔗');
    }
    setIsMenuOpen(false);
  };

  return (
    <article className="bento-card bg-surface dark:bg-[#121212] border border-border-light shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 group/post animate-scale-in rounded-[2rem]">
      {/* Editorial Header */}
      <div className="p-4 sm:p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/user/${post.authorId}`} className="relative group/avatar shrink-0">
               <div className="absolute -inset-0.5 bg-linear-to-tr from-primary to-accent rounded-xl opacity-0 group-hover/avatar:opacity-75 transition-opacity blur-[2px]"></div>
               <div className="relative size-12 rounded-xl overflow-hidden border border-border-light bg-bg-main shadow-inner transform group-hover/avatar:scale-[1.02] transition-transform duration-300">
                  <img 
                    src={authorAvatar} 
                    alt={authorName}
                    className="w-full h-full object-cover"
                  />
               </div>
            </Link>
            <div className="min-w-0">
               <div className="flex items-center gap-2">
                  <Link to={`/user/${post.authorId}`} className="text-sm font-black text-on-surface hover:text-primary transition-colors truncate block">
                    {authorName}
                  </Link>
                  <div className="size-1 rounded-full bg-border-light"></div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest shrink-0">Editor</span>
               </div>
               <div className="flex items-center gap-2 text-on-surface-variant/70 text-[11px] font-semibold mt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">public</span>
                    Public
                  </span>
                  <span>•</span>
                  <span>{timeAgo}</span>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {['specialist', 'expert', 'case_manager', 'practitioner', 'management', 'editor', 'verified', 'mentor', 'architect', 'curator'].some(r => post.authorRole?.toLowerCase().includes(r)) && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('open-booking-modal', { 
                    detail: { 
                      id: post.authorId, 
                      displayName: post.authorName, 
                      photoURL: post.authorPhoto 
                    } 
                  }));
                }}
                className="hidden sm:flex px-5 py-2 bg-ur-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-ur-primary/20 hover:scale-105 transition-all active:scale-95 items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">event</span>
                Book Now
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="size-10 rounded-xl hover:bg-bg-main flex items-center justify-center text-on-surface-variant transition-colors group/menu"
              >
                <span className="material-symbols-outlined">more_horiz</span>
              </button>

              {isMenuOpen && (
                <div className="absolute inset-e-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-border-light py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  {currentUserId === post.authorId ? (
                    <>
                      <button 
                        onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-start flex items-center gap-3 hover:bg-bg-main text-sm font-bold text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        {t('common.edit')}
                      </button>
                      <button 
                        onClick={handleCopy}
                        className="w-full px-4 py-2.5 text-start flex items-center gap-3 hover:bg-bg-main text-sm font-bold text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                        {t('common.copy')}
                      </button>
                      <div className="h-px bg-border-light my-1"></div>
                      <button 
                        onClick={handleDelete}
                        className="w-full px-4 py-2.5 text-start flex items-center gap-3 hover:bg-red-50 text-red-600 text-sm font-bold transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        {t('common.delete')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={handleCopy}
                        className="w-full px-4 py-2.5 text-start flex items-center gap-3 hover:bg-bg-main text-sm font-bold text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                        {t('common.copy')}
                      </button>
                      <button 
                        onClick={handleShare}
                        className="w-full px-4 py-2.5 text-start flex items-center gap-3 hover:bg-bg-main text-sm font-bold text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">share</span>
                        {t('common.share')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-bg-main border border-border-light rounded-2xl p-4 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none min-h-[120px]"
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-bg-main text-on-surface-variant rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-border-light transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm sm:text-base text-on-surface dark:text-gray-300 leading-8 font-medium whitespace-pre-wrap selection:bg-primary/20">
            {postContentText}
          </p>
        )}
        
        {post.mediaUrl && (
          <div className="relative -mx-4 sm:-mx-6 mt-4 group/media overflow-hidden">
             <div className="aspect-video bg-bg-main/50 dark:bg-slate-900 border-y border-border-light overflow-hidden">
                {post.mediaType === 'video' ? (
                  <video 
                    src={post.mediaUrl} 
                    className="w-full h-full object-contain" 
                    controls 
                    preload="metadata"
                    playsInline
                  />
                ) : (
                  <img 
                    src={post.mediaUrl} 
                    alt="Post media" 
                    className="w-full h-full object-cover group-hover/media:scale-[1.02] transition-transform duration-1000" 
                  />
                )}
             </div>
             <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        )}
      </div>

      {/* Social Bar */}
      <div className="p-4 sm:p-6 pt-6 bg-surface/50 dark:bg-zinc-900/30">
        <div className="flex items-center justify-between pb-6 border-b border-border-light/50 mb-6">
           <div 
             className="flex -space-x-2 items-center cursor-pointer hover:bg-primary/5 p-2 rounded-2xl transition-all group/likers"
             onClick={(e) => {
               e.stopPropagation();
               setIsInteractionsModalOpen(true);
             }}
           >
              <div className="flex items-center gap-1.5">
                {userReaction && (
                  <span className="text-lg drop-shadow-sm animate-bounce-subtle">{userReaction}</span>
                )}
                <div className="flex -space-x-1.5">
                  {post.recentLikerPhotos && post.recentLikerPhotos.length > 0 ? (
                    post.recentLikerPhotos.slice(0, 3).map((photo: string, i: number) => (
                      <div key={i} className="size-7 rounded-full border-2 border-surface overflow-hidden shadow-sm transition-transform group-hover/likers:scale-110" style={{ transitionDelay: `${i * 50}ms` }}>
                        <img src={photo || `https://ui-avatars.com/api/?name=U`} alt="Liker" className="size-full object-cover" />
                      </div>
                    ))
                  ) : (
                    <div className="size-7 rounded-full border-2 border-surface bg-rose-500 flex items-center justify-center shadow-sm">
                      <Heart className="size-3 text-white fill-current" />
                    </div>
                  )}
                </div>
              </div>
              <span className="ps-3 text-[11px] font-black text-on-surface-variant group-hover/likers:text-primary tracking-wider uppercase transition-colors">
                  {likesCount} {t('home.insights')}
              </span>
           </div>
           <div className="flex items-center gap-3 text-[11px] font-black text-on-surface-variant uppercase tracking-widest bg-bg-main/50 px-4 py-2 rounded-xl border border-border-light/30">
              <span>{post.commentsCount || 0} Comms</span>
           </div>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-4 relative">
            {/* Reaction Picker Overlay */}
            <AnimatePresence>
              {showReactionPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-4 p-2 bg-white dark:bg-zinc-800 border border-border-light rounded-[1.5rem] shadow-2xl z-[60] grid grid-cols-4 sm:grid-cols-8 gap-1"
                  onMouseEnter={() => {
                    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
                  }}
                  onMouseLeave={() => {
                    setShowReactionPicker(false);
                  }}
                >
                  {REACTIONS.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleReaction(r.emoji)}
                      className="size-10 flex items-center justify-center text-2xl hover:scale-150 transition-transform duration-300 hover:-translate-y-2"
                      title={r.label}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="contents">
              {/* React Button */}
              <div 
                className="relative"
                onMouseEnter={() => {
                  reactionTimeoutRef.current = setTimeout(() => setShowReactionPicker(true), 500);
                }}
                onMouseLeave={() => {
                  if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
                }}
              >
                <button 
                  onClick={handleLike}
                  className={clsx(
                    "w-full flex flex-col sm:flex-row items-center justify-center gap-3 py-4 rounded-3xl transition-all duration-300 group/btn border border-transparent",
                    userReaction ? "bg-rose-50 dark:bg-rose-500/10" : "bg-zinc-50 dark:bg-zinc-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-500/5"
                  )}
                >
                  <div className={clsx(
                    "size-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    userReaction ? "bg-rose-500 text-white" : "bg-white dark:bg-zinc-800 text-on-surface-variant group-hover/btn:text-rose-500"
                  )}>
                    {userReaction ? (
                      <span className="text-xl">{userReaction}</span>
                    ) : (
                      <Heart className={clsx("size-5 transition-transform group-hover/btn:scale-125", userReaction && "fill-current")} />
                    )}
                  </div>
                  <span className={clsx(
                    "hidden xl:inline text-[11px] font-black uppercase tracking-[0.2em]",
                    userReaction ? "text-rose-500" : "text-on-surface-variant group-hover/btn:text-on-surface"
                  )}>
                    {userReaction ? REACTIONS.find(r => r.emoji === userReaction)?.label : 'React'}
                  </span>
                </button>
              </div>

              {/* Comment Button */}
              <button 
                onClick={() => setShowComments(!showComments)}
                className={clsx(
                  "flex flex-col sm:flex-row items-center justify-center gap-3 py-4 rounded-3xl transition-all duration-300 group/btn border border-transparent",
                  showComments ? "bg-primary/10" : "bg-zinc-50 dark:bg-zinc-900/50 hover:bg-primary/5"
                )}
              >
                <div className={clsx(
                  "size-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                  showComments ? "bg-primary text-white" : "bg-white dark:bg-zinc-800 text-on-surface-variant group-hover/btn:text-primary"
                )}>
                  <MessageCircle className="size-5 transition-transform group-hover/btn:scale-125" />
                </div>
                <span className={clsx(
                  "hidden xl:inline text-[11px] font-black uppercase tracking-[0.2em]",
                  showComments ? "text-primary" : "text-on-surface-variant group-hover/btn:text-on-surface"
                )}>
                  Comment
                </span>
              </button>

              {/* Share Button */}
              <button 
                onClick={handleShare}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4 rounded-3xl transition-all duration-300 group/btn border border-transparent bg-zinc-50 dark:bg-zinc-900/50 hover:bg-blue-50 dark:hover:bg-blue-500/5"
              >
                <div className="size-10 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-on-surface-variant transition-all duration-500 shadow-sm group-hover/btn:text-blue-500">
                  <Share2 className="size-5 transition-transform group-hover/btn:scale-125" />
                </div>
                <span className="hidden xl:inline text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant group-hover/btn:text-on-surface">
                  Share
                </span>
              </button>

              {/* Spread Button */}
              <button 
                onClick={handleRepost}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4 rounded-3xl transition-all duration-300 group/btn border border-transparent bg-zinc-50 dark:bg-zinc-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/5"
              >
                <div className="size-10 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-on-surface-variant transition-all duration-500 shadow-sm group-hover/btn:text-indigo-500">
                  <Repeat className="size-5 transition-transform group-hover/btn:scale-125" />
                </div>
                <span className="hidden xl:inline text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant group-hover/btn:text-on-surface">
                  Spread
                </span>
              </button>

              {/* Archive Button */}
              <button 
                onClick={handleArchive}
                className={clsx(
                  "flex flex-col sm:flex-row items-center justify-center gap-3 py-4 rounded-3xl transition-all duration-300 group/btn border border-transparent",
                  isBookmarked ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-zinc-50 dark:bg-zinc-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5"
                )}
              >
                <div className={clsx(
                  "size-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                  isBookmarked ? "bg-emerald-500 text-white" : "bg-white dark:bg-zinc-800 text-on-surface-variant group-hover/btn:text-emerald-500"
                )}>
                  <Archive className="size-5 transition-transform group-hover/btn:scale-125" />
                </div>
                <span className={clsx(
                  "hidden xl:inline text-[11px] font-black uppercase tracking-[0.2em]",
                  isBookmarked ? "text-emerald-500" : "text-on-surface-variant group-hover/btn:text-on-surface"
                )}>
                  Archive
                </span>
              </button>
            </div>
        </div>

        {showComments && (
          <CommentsSection 
            postId={post.id} 
            currentUserId={currentUserId} 
            currentUserData={user}
          />
        )}
      </div>

      <InteractionsModal
        isOpen={isInteractionsModalOpen}
        onClose={() => setIsInteractionsModalOpen(false)}
        postId={post.id}
        currentUserId={currentUserId}
      />
    </article>
  );
}
