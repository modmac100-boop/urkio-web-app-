import React, { useState, useRef } from 'react';
import { X, Loader2, Image as ImageIcon, FileText } from 'lucide-react';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';

interface ArticleCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userData: any;
  onArticleCreated?: (article: any) => void;
}

export function ArticleCreatorModal({ isOpen, onClose, user, userData, onArticleCreated }: ArticleCreatorModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleMediaPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      let mediaUrl = '';
      if (mediaFile) {
        const mediaRef = ref(storage, `articles/${user.uid}/${Date.now()}_${mediaFile.name}`);
        const snapshot = await uploadBytes(mediaRef, mediaFile);
        mediaUrl = await getDownloadURL(snapshot.ref);
      }

      const newArticle: any = {
        title: title,
        content: content,
        authorId: user.uid,
        authorName: userData?.displayName || user.email?.split('@')[0] || 'User',
        authorPhoto: userData?.photoURL || user.photoURL || null,
        type: 'article',
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
      };

      if (mediaUrl) {
        newArticle.mediaUrl = mediaUrl;
        newArticle.mediaType = 'image';
      }

      const docRef = await addDoc(collection(db, 'posts'), newArticle);
      
      const createdArticle = { id: docRef.id, ...newArticle, createdAt: new Date() };
      
      if (onArticleCreated) {
        onArticleCreated(createdArticle);
      }
      
      toast.success('Article published successfully!');
      onClose();
      
      // Reset
      setTitle('');
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
    } catch (error: any) {
      console.error('Error creating article:', error);
      toast.error(error.message || 'Failed to publish article.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-2xl font-black dark:text-white flex items-center gap-3 italic">
            <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-500" />
            </div>
            PUBLISH EDITORIAL
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <div className="space-y-4">
            {mediaPreview ? (
              <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-indigo-500/20 bg-indigo-500/5 aspect-video">
                <img src={mediaPreview} alt="Cover" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute top-4 inset-e-4 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-900 transition-all text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-21/9 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-500/5 transition-all group"
              >
                <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Add Cover Image</span>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMediaPick} />
              </button>
            )}

            <input 
              type="text" 
              required
              placeholder="Article Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-black bg-transparent border-none placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0 px-0 dark:text-white"
            />
            
            <textarea 
              required
              placeholder="Write your story here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[300px] bg-transparent border-none resize-none focus:ring-0 p-0 text-lg leading-relaxed text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium"
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 font-black text-xs uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Saves as Draft
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-8 py-3 bg-on-surface text-surface font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> PUBLISHING...</>
            ) : (
              <>PUBLISH NOW</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
