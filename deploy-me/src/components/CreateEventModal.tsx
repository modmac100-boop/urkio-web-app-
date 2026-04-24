import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, Image as ImageIcon, Loader2, Video as VideoIcon, Mic } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userData: any;
}

export function CreateEventModal({ isOpen, onClose, user, userData }: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<'course' | 'session' | 'live_stream'>('session');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;

    setIsSubmitting(true);
    try {
      let mediaUrl = '';
      if (mediaFile) {
        const storageRef = ref(storage, `events/${user.uid}/${Date.now()}_${mediaFile.name}`);
        const snapshot = await uploadBytes(storageRef, mediaFile);
        mediaUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'events'), {
        title,
        description,
        date: new Date(`${date}T${time}`).toISOString(),
        time,
        location,
        type,
        mediaUrl,
        creatorId: user.uid,
        creatorName: userData?.displayName || user.email,
        creatorPhoto: userData?.photoURL || user.photoURL || null,
        attendees: [user.uid],
        createdAt: serverTimestamp()
      });
      toast.success('Event promoted successfully!');
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      setMediaFile(null);
      setType('session');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">event</span>
            Create Event
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Title *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Morning Yoga Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Event Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['session', 'course', 'live_stream'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    type === t 
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/50'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Announcement Media (Photo/Video)</label>
            <div 
              onClick={() => document.getElementById('event-media-home')?.click()}
              className="group relative h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30"
            >
              {mediaFile ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 truncate max-w-[200px]">{mediaFile.name}</span>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMediaFile(null); }}
                    className="text-[10px] font-black text-red-500 uppercase hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors mb-2" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center px-4">
                    Upload eye-catching media for your spotlight
                  </span>
                </>
              )}
              <input 
                id="event-media-home"
                type="file" 
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Time *</label>
              <input 
                type="time" 
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Location or Link</label>
            <input 
              type="text" 
              placeholder="e.g. Zoom Link or San Francisco Park"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              disabled={isSubmitting || !title || !date || !time}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <><span className="material-symbols-outlined animate-spin text-sm">cycle</span> Creating...</>
              ) : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
