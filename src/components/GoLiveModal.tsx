import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Video } from 'lucide-react';

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userData: any;
}

export function GoLiveModal({ isOpen, onClose, user, userData }: GoLiveModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  if (!isOpen) return null;

  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsStarting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: userData?.displayName || user.email,
        authorPhoto: userData?.photoURL || user.photoURL || null,
        content: `🔴 LIVE NOW: ${title}\n${description}`,
        mediaType: 'live',
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        createdAt: serverTimestamp()
      });
      onClose();
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error starting live stream:', error);
      alert('Failed to start live stream. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Go Live
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStartLive} className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
            <span className="material-symbols-outlined shrink-0">info</span>
            <p>Starting a live stream will automatically notify your followers and create a post on your feed.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Stream Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly Wellness Check-in"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">What's on your mind?</label>
            <textarea
              placeholder="Give people some context about this stream..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none min-h-[100px]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isStarting || !title}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isStarting ? (
                <><span className="material-symbols-outlined animate-spin text-sm">cycle</span> Starting...</>
              ) : 'Start Broadcasting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
