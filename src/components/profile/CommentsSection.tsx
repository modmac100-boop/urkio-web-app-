import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2, MessageCircle, Heart, Smile, MoreHorizontal, Repeat, Archive, Share2, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  createdAt: any;
  likesCount?: number;
  repostsCount?: number;
  reactions?: Record<string, string>;
}

interface CommentsSectionProps {
  postId: string;
  currentUserId?: string;
  currentUserData?: any;
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

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  currentUserData?: any;
  postId: string;
  onReply: (userName: string) => void;
  onReaction: (commentId: string, emoji: string) => void;
  onRepost: (comment: Comment) => void;
  onShare: (comment: Comment) => void;
  onArchive: (commentId: string) => void;
}

function CommentItem({ 
  comment, 
  currentUserId, 
  currentUserData, 
  postId,
  onReply,
  onReaction,
  onRepost,
  onShare,
  onArchive
}: CommentItemProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const reactionTimeoutRef = useRef<any>(null);
  const userReaction = currentUserId ? comment.reactions?.[currentUserId] : null;

  const handleReactionSelect = (emoji: string) => {
    onReaction(comment.id, emoji);
    setShowReactionPicker(false);
  };

  const handleArchiveClick = () => {
    setIsBookmarked(!isBookmarked);
    onArchive(comment.id);
  };

  return (
    <div className="flex gap-4 group/comment">
      <div className="size-9 rounded-xl overflow-hidden shrink-0 border border-border-light">
        <img 
          src={comment.userPhoto || `https://ui-avatars.com/api/?name=${comment.userName}`} 
          className="w-full h-full object-cover" 
          alt="" 
        />
      </div>
      <div className="flex-1 space-y-2">
        <div className="bg-bg-main dark:bg-zinc-900/50 rounded-2xl rounded-ts-none p-4 border border-border-light group-hover/comment:border-primary/20 transition-colors relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black text-on-surface dark:text-gray-200 uppercase tracking-tight">
              {comment.userName}
            </span>
            <span className="text-[9px] font-bold text-on-surface-variant/60">
              {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate()) + ' ago' : 'Just now'}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant dark:text-gray-400 font-medium leading-relaxed">
            {comment.content}
          </p>
          
          {/* Comment Summary */}
          {(comment.likesCount && comment.likesCount > 0) || (comment.repostsCount && comment.repostsCount > 0) ? (
            <div className="absolute -bottom-3 inset-e-4 bg-white dark:bg-zinc-800 border border-border-light rounded-full px-2 py-0.5 shadow-sm flex items-center gap-1.5 z-10">
              <div className="flex -space-x-1">
                {Array.from(new Set(Object.values(comment.reactions || {}))).slice(0, 3).map((emoji, i) => (
                  <span key={i} className="text-[10px]">{emoji}</span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {comment.likesCount && comment.likesCount > 0 && (
                  <span className="text-[10px] font-black text-on-surface-variant">{comment.likesCount}</span>
                )}
                {comment.repostsCount && comment.repostsCount > 0 && (
                  <div className="flex items-center gap-1 border-s border-border-light ps-1.5 ms-0.5">
                    <Repeat size={10} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-on-surface-variant">{comment.repostsCount}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Comment Actions - Refined Premium Layout */}
        <div className="flex items-center gap-1 sm:gap-2 px-1 py-2 relative">
          {/* React */}
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
              onClick={() => onReaction(comment.id, userReaction || '❤️')}
              className={clsx(
                "flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-all duration-300 group/btn border border-transparent",
                userReaction ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10" : "hover:bg-rose-50 text-on-surface-variant hover:text-rose-500 dark:hover:bg-rose-500/5"
              )}
            >
              <div className={clsx(
                "size-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
                userReaction ? "bg-rose-500 text-white" : "bg-white dark:bg-zinc-800 text-on-surface-variant group-hover/btn:text-rose-500"
              )}>
                {userReaction ? (
                  <span className="text-sm">{userReaction}</span>
                ) : (
                  <Heart size={14} className={clsx("transition-transform group-hover/btn:scale-110", userReaction && "fill-current")} />
                )}
              </div>
              <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">
                {userReaction ? REACTIONS.find(r => r.emoji === userReaction)?.label : 'React'}
              </span>
            </button>

            <AnimatePresence>
              {showReactionPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-zinc-800 border border-border-light rounded-2xl shadow-2xl z-60 grid grid-cols-4 sm:grid-cols-8 gap-1 min-w-max"
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
                      onClick={() => handleReactionSelect(r.emoji)}
                      className="size-9 flex items-center justify-center text-xl hover:scale-150 transition-transform duration-300 hover:-translate-y-1"
                      title={r.label}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Comment (Reply) */}
          <button 
            onClick={() => onReply(comment.userName)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all duration-300 group/btn border border-transparent"
          >
            <div className="size-8 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-on-surface-variant group-hover/btn:text-primary shadow-sm transition-all duration-300">
              <MessageCircle size={14} className="transition-transform group-hover/btn:scale-110" />
            </div>
            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Comment</span>
          </button>

          {/* Spread (Repost) */}
          <button 
            onClick={() => onRepost(comment)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-on-surface-variant hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-300 group/btn border border-transparent"
          >
            <div className="size-8 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-on-surface-variant group-hover/btn:text-indigo-500 shadow-sm transition-all duration-300">
              <Repeat size={14} className="transition-transform group-hover/btn:scale-110" />
            </div>
            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Spread</span>
          </button>

          {/* Share */}
          <button 
            onClick={() => onShare(comment)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-on-surface-variant hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-300 group/btn border border-transparent"
          >
            <div className="size-8 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-on-surface-variant group-hover/btn:text-blue-500 shadow-sm transition-all duration-300">
              <Share2 size={14} className="transition-transform group-hover/btn:scale-110" />
            </div>
            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Share</span>
          </button>

          {/* Archive */}
          <button 
            onClick={handleArchiveClick}
            className={clsx(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-all duration-300 group/btn border border-transparent",
              isBookmarked ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10" : "text-on-surface-variant hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
            )}
          >
            <div className={clsx(
              "size-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
              isBookmarked ? "bg-emerald-500 text-white" : "bg-white dark:bg-zinc-800 text-on-surface-variant group-hover/btn:text-emerald-500"
            )}>
              <Archive size={14} className={clsx("transition-transform group-hover/btn:scale-110", isBookmarked && "fill-current")} />
            </div>
            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Archive</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommentsSection({ postId, currentUserId, currentUserData }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [issubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleCommentReaction = async (commentId: string, emoji: string) => {
    if (!currentUserId) return toast.error('Please sign in to react.');
    
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const oldReaction = comment.reactions?.[currentUserId];
    const isRemoving = oldReaction === emoji;

    try {
      const commentRef = doc(db, 'comments', commentId);
      const updates: any = {
        [`reactions.${currentUserId}`]: isRemoving ? null : emoji,
        likesCount: increment(isRemoving ? -1 : (!oldReaction ? 1 : 0))
      };

      await updateDoc(commentRef, updates);
      if (!isRemoving) toast.success(`${emoji} added!`);
    } catch (err) {
      console.error('Comment reaction error:', err);
      toast.error('Could not update reaction.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId || issubmitting) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        postId,
        userId: currentUserId,
        userName: currentUserData?.displayName || 'User',
        userPhoto: currentUserData?.photoURL || '',
        content: newComment.trim(),
        createdAt: serverTimestamp(),
        likesCount: 0,
        repostsCount: 0,
        reactions: {}
      };

      await addDoc(collection(db, 'comments'), commentData);
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });
      
      setNewComment('');
      toast.success('Comment posted!');
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error('Failed to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (userName: string) => {
    setNewComment(`@${userName} `);
    const input = document.getElementById('comment-input');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCommentShare = (comment: Comment) => {
    const text = `"${comment.content}" - ${comment.userName} on Urkio`;
    const url = `${window.location.origin}/post/${postId}`;
    
    if (navigator.share) {
      navigator.share({ title: 'Urkio Comment', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('Comment link copied!');
    }
  };

  const handleCommentRepost = async (comment: Comment) => {
    if (!currentUserId) return toast.error('Please sign in to spread.');
    try {
      await addDoc(collection(db, 'posts'), {
        content: `Comment by ${comment.userName}: "${comment.content}"`,
        authorId: currentUserId,
        authorName: currentUserData?.displayName || 'You',
        authorPhoto: currentUserData?.photoURL || '',
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        repostOf: { 
          authorName: comment.userName, 
          authorId: comment.userId,
          commentId: comment.id,
          originalPostId: postId
        },
      });
      await updateDoc(doc(db, 'comments', comment.id), { repostsCount: increment(1) });
      toast.success('Comment spread successfully! 🔁');
    } catch (err) {
      console.error('Comment spread error:', err);
      toast.error('Failed to spread comment.');
    }
  };

  const handleCommentArchive = (commentId: string) => {
    toast.success('Comment added to archive! 🔖');
  };

  return (
    <div className="mt-4 pt-6 border-t border-border-light animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <MessageSquare size={16} />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">
          Discussion ({comments.length})
        </h3>
      </div>

      {/* Input */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          <div className="size-10 rounded-xl overflow-hidden shrink-0 border border-border-light">
            <img 
              src={currentUserData?.photoURL || `https://ui-avatars.com/api/?name=${currentUserData?.displayName || 'U'}`} 
              className="w-full h-full object-cover" 
              alt="Me" 
            />
          </div>
          <div className="flex-1 relative">
            <input
              id="comment-input"
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a professional comment..."
              className="w-full bg-bg-main border border-border-light rounded-2xl py-3 px-5 pr-12 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/50"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || issubmitting}
              className="absolute inset-e-2 top-1/2 -translate-y-1/2 size-8 bg-on-surface text-surface rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-30 disabled:hover:scale-100"
            >
              {issubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-bg-main rounded-2xl text-center mb-8 border border-dashed border-border-light">
          <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest">
            Please sign in to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserData={currentUserData}
              postId={postId}
              onReply={handleReply}
              onReaction={handleCommentReaction}
              onRepost={handleCommentRepost}
              onShare={handleCommentShare}
              onArchive={handleCommentArchive}
            />
          ))
        ) : (
          <div className="text-center py-10 opacity-40">
            <MessageSquare className="mx-auto mb-3 opacity-20" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No comments yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
