import React, { useState, useRef } from 'react';
import { Camera, Calendar, FileText, X, Loader2 } from 'lucide-react';
import { db, storage, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';

interface PostCreatorProps {
  userAvatar?: string;
  userData?: any;
  onPostClick?: () => void;
  onPostCreated?: (post: any) => void;
  onEventClick?: () => void;
  onArticleClick?: () => void;
}

export function PostCreator({ 
  userAvatar, 
  userData,
  onPostClick,
  onPostCreated,
  onEventClick,
  onArticleClick
}: PostCreatorProps) {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${isVideo ? '50MB' : '5MB'}`);
        return;
      }
      setMediaFile(file);
      setMediaType(isVideo ? 'video' : 'image');
      setMediaPreview(URL.createObjectURL(file));
    }
    if (e.target) e.target.value = '';
  };

  const handlePost = async () => {
    if ((!content.trim() && !mediaFile) || isPosting) return;

    if (!auth.currentUser) {
      toast.error('You must be signed in to post.');
      return;
    }

    setIsPosting(true);
    try {
      const isExpert = ['specialist', 'expert', 'case_manager', 'practitioner', 'management'].includes(userData?.role?.toLowerCase() || '') || userData?.userType === 'expert' || userData?.role === 'specialist';
      let mediaUrl = '';
      if (mediaFile) {
        const mediaRef = ref(storage, `posts/${auth.currentUser.uid}/${Date.now()}_${mediaFile.name}`);
        const snapshot = await uploadBytes(mediaRef, mediaFile);
        mediaUrl = await getDownloadURL(snapshot.ref);
      }

      const newPost: any = {
        content: content,
        authorId: auth.currentUser.uid,
        authorName: userData?.displayName || auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
        authorPhoto: userData?.photoURL || auth.currentUser.photoURL || userAvatar || null,
        authorRole: userData?.role || 'user',
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
      };

      if (mediaUrl) {
        newPost.mediaUrl = mediaUrl;
        newPost.mediaType = mediaType;
      }

      const docRef = await addDoc(collection(db, 'posts'), newPost);
      
      const createdPost = { id: docRef.id, ...newPost, createdAt: new Date() };
      
      if (onPostCreated) {
        onPostCreated(createdPost);
      }
      
      toast.success('Post created successfully!');
      
      // Reset state
      setContent('');
      setMediaFile(null);
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
      setMediaType(null);
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="bento-card border border-border-light shadow-sm p-4 sm:p-6 bg-surface dark:bg-surface transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <div className="flex gap-4 items-start">
        <div className="shrink-0 size-12 rounded-xl bg-bg-main overflow-hidden border border-border-light group cursor-pointer hover:scale-105 transition-transform duration-500">
           <img 
             src={userAvatar || `https://ui-avatars.com/api/?name=User`} 
             alt="Avatar" 
             className="w-full h-full object-cover"
           />
        </div>
        
        <div className="flex-1 relative">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPosting}
            placeholder="Share an update, article, or event..."
            className="w-full bg-bg-main hover:bg-white dark:hover:bg-slate-800 border border-border-light text-on-surface text-sm font-bold py-3.5 px-6 ltr:pr-10 rtl:pl-10 rounded-2xl transition-all duration-300 shadow-inner resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[50px] placeholder:text-on-surface-variant/70"
            rows={content.split('\n').length > 1 ? Math.min(content.split('\n').length, 5) : 1}
            onClick={onPostClick}
          />
          {!content && !mediaFile && (
            <div className="absolute inset-e-4 top-5 size-1.5 rounded-full bg-primary/40 transition-colors pointer-events-none"></div>
          )}

          {mediaPreview && (
            <div className="relative mt-4 inline-block w-full max-w-md">
              {mediaType === 'video' ? (
                <video src={mediaPreview} controls className="max-h-64 rounded-xl border border-border-light bg-black w-full object-contain" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="max-h-64 rounded-xl border border-border-light object-contain w-full" />
              )}
              <button
                type="button"
                onClick={() => {
                  setMediaFile(null);
                  if (mediaPreview) URL.revokeObjectURL(mediaPreview);
                  setMediaPreview(null);
                  setMediaType(null);
                }}
                className="absolute -top-3 -inset-e-3 p-1.5 bg-surface text-on-surface-variant rounded-full shadow-md hover:bg-bg-main transition-colors border border-border-light z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-light">
          <div className="flex flex-wrap gap-2 sm:gap-6">
             <input
               type="file"
               ref={fileInputRef}
               className="hidden"
               accept="image/*,video/*"
               onChange={handleMediaPick}
             />
             <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={isPosting}
               className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl hover:bg-primary/5 text-primary transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Media</span>
             </button>
             <button 
               onClick={onEventClick || (() => toast('Event creation coming soon', { icon: '🗓️' }))}
               disabled={isPosting}
               className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl hover:bg-accent/5 text-accent transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Event</span>
             </button>
             <button 
               onClick={onArticleClick || (() => toast('Article editor coming soon', { icon: '✍️' }))}
               disabled={isPosting}
               className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-xl hover:bg-indigo-500/5 text-indigo-500 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Article</span>
             </button>
          </div>
          
          <button 
            onClick={handlePost}
            disabled={(!content.trim() && !mediaFile) || isPosting}
            className="flex items-center gap-2 px-6 py-2.5 bg-on-surface text-surface rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
             {isPosting ? <><Loader2 className="w-4 h-4 animate-spin" /> POSTING...</> : 'POST'}
          </button>
      </div>
    </div>
  );
}
