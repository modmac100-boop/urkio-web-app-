import React, { useEffect, useState, useRef } from 'react';
import { 
  collection, query, orderBy, limit, getDocs, addDoc, 
  serverTimestamp, updateDoc, doc, arrayUnion, deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { 
  Plus, X, Heart, Image as ImageIcon, Video, 
  Loader2, Camera, ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  mediaUrl: string;
  type: 'image' | 'video';
  createdAt: number;
  likes: string[];
  caption?: string;
  attachmentUrl?: string;
}

interface StoryUserGroup {
  uid: string;
  displayName: string;
  photoURL: string;
  stories: Story[];
  hasUnseen: boolean;
}

interface StoryBarProps {
  currentUserId?: string;
  userData?: any;
}

export function StoryBar({ currentUserId, userData }: StoryBarProps) {
  const [userGroups, setUserGroups] = useState<StoryUserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingUserIdx, setViewingUserIdx] = useState(0);

  const fetchStories = async () => {
    try {
      const q = query(
        collection(db, 'stories'),
        orderBy('createdAt', 'desc'),
        limit(150)
      );
      const snap = await getDocs(q);
      const fetchedStories = snap.docs.map(d => ({ id: d.id, ...d.data() } as Story));
      
      const now = Date.now();
      const validStories = fetchedStories.filter(s => now - s.createdAt < 24 * 60 * 60 * 1000);

      const groupsMap = new Map<string, StoryUserGroup>();
      validStories.forEach(story => {
        if (!groupsMap.has(story.authorId)) {
          groupsMap.set(story.authorId, {
            uid: story.authorId,
            displayName: story.authorName,
            photoURL: story.authorPhoto,
            stories: [],
            hasUnseen: true
          });
        }
        groupsMap.get(story.authorId)!.stories.unshift(story);
      });
      
      setUserGroups(Array.from(groupsMap.values()));
    } catch (err) {
      console.error('Fetch stories error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const openViewer = (idx: number) => {
    setViewingUserIdx(idx);
    setViewerOpen(true);
  };

  const handleStoryUploaded = () => {
    setUploadModalOpen(false);
    fetchStories();
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar min-h-[100px]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
            <div className="size-[70px] rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-2 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-5 overflow-x-auto pb-6 no-scrollbar items-start">
        {currentUserId && userData && (
          <div className="flex flex-col items-center gap-2 group cursor-pointer shrink-0" onClick={() => setUploadModalOpen(true)}>
            <div className="relative p-1 rounded-2xl transition-all duration-500 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary/20">
              <div className="size-16 rounded-xl bg-surface p-0.5 overflow-hidden relative">
                <img
                  src={userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}`}
                  alt="Your Story"
                  className="w-full h-full object-cover rounded-[10px] opacity-80"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="size-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <Plus className="size-4" />
                  </div>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-primary transition-colors max-w-[70px] truncate">
              Update
            </span>
          </div>
        )}

        {userGroups.map((group, idx) => (
          <button
            key={group.uid}
            onClick={() => openViewer(idx)}
            className="flex flex-col items-center gap-2 group cursor-pointer shrink-0 bg-transparent border-0 p-0"
          >
            <div className={`relative p-1 rounded-2xl transition-all duration-500 transform group-hover:scale-105 ${
              group.hasUnseen
                ? 'bg-linear-to-tr from-[#136dec] via-[#8b5cf6] to-[#ec4899] animate-gradient-xy'
                : 'bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary/20'
            }`}>
              <div className="size-16 rounded-xl bg-surface dark:bg-zinc-900 p-0.5 overflow-hidden">
                <img
                  src={group.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.displayName)}`}
                  alt={group.displayName}
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-primary transition-colors max-w-[70px] truncate px-1">
              {group.displayName.split(' ')[0]}
            </span>
          </button>
        ))}
        {userGroups.length === 0 && !currentUserId && (
          <div className="text-[11px] text-zinc-400 font-black uppercase tracking-widest py-4 italic">No transmissions.</div>
        )}
      </div>

      {uploadModalOpen && currentUserId && userData && (
        <StoryUploadModal 
          user={userData} 
          currentUserId={currentUserId}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleStoryUploaded}
        />
      )}

      {viewerOpen && userGroups.length > 0 && (
        <StoryViewer 
          groups={userGroups} 
          initialGroupIdx={viewingUserIdx}
          currentUserId={currentUserId}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

export function StoryUploadModal({ user, currentUserId, onClose, onSuccess }: any) {
  const [file, setFile] = useState<File | Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  
  // Recording states
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsRecordingMode(true);
    } catch (err) {
      console.error(err);
      toast.error("Camera access denied");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsRecordingMode(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        setFile(blob);
        setType('image');
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current);
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setFile(blob);
      setType('video');
      setPreview(URL.createObjectURL(blob));
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setIsRecording(true);
  };

  const stopVideoRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setType(f.type.startsWith('video') ? 'video' : 'image');
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file || !currentUserId) return;
    setUploading(true);
    try {
      const ext = type === 'video' ? 'webm' : (file instanceof File && file.type.includes('png') ? 'png' : 'jpg');
      const sRef = ref(storage, `stories/${currentUserId}/${Date.now()}.${ext}`);
      await uploadBytes(sRef, file);
      const mediaUrl = await getDownloadURL(sRef);

      await addDoc(collection(db, 'stories'), {
        authorId: currentUserId,
        authorName: user.displayName || 'User',
        authorPhoto: user.photoURL || '',
        mediaUrl,
        type,
        caption,
        attachmentUrl,
        createdAt: Date.now(),
        likes: []
      });
      toast.success("Status updated!");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xl">
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative border border-white/5">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Broadcast Status</h2>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        
        <div className="p-6">
          {!preview && !isRecordingMode ? (
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[24px] cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group">
                <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-primary mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Upload</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
              </label>
              <button 
                onClick={startCamera}
                className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[24px] cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group"
              >
                <Camera className="w-8 h-8 text-zinc-400 group-hover:text-primary mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Record</span>
              </button>
            </div>
          ) : isRecordingMode ? (
            <div className="space-y-4">
              <div className="bg-black rounded-[24px] overflow-hidden aspect-[3/4] relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-6 inset-x-0 flex justify-center gap-6">
                  {!isRecording ? (
                    <>
                      <button onClick={capturePhoto} className="size-16 rounded-full bg-white border-4 border-zinc-300 shadow-xl" />
                      <button onClick={startVideoRecording} className="size-16 rounded-full bg-red-500 border-4 border-white shadow-xl animate-pulse" />
                    </>
                  ) : (
                    <button onClick={stopVideoRecording} className="size-16 rounded-xl bg-red-600 shadow-xl" />
                  )}
                </div>
              </div>
              <button onClick={stopCamera} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Cancel</button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-[24px] overflow-hidden aspect-[3/4] relative flex items-center justify-center">
                {type === 'image' ? (
                  <img src={preview!} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={preview!} controls className="w-full h-full object-cover" />
                )}
                <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-4 inset-e-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-md">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-sm font-semibold focus:ring-2 focus:ring-primary/20"
                />
                <input 
                  type="text" 
                  placeholder="Add a link (https://...)"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-xs font-bold tracking-tight text-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button 
                onClick={handleUpload} 
                disabled={uploading} 
                className="w-full py-4 bg-linear-to-r from-[#136dec] to-[#8b5cf6] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Transmit to Status"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export function StoryViewer({ groups, initialGroupIdx, currentUserId, onClose }: any) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
  const [storyIdx, setStoryIdx] = useState(0);

  const activeGroup = groups[groupIdx];
  const activeStory = activeGroup.stories[storyIdx];

  const goNext = () => {
    if (storyIdx < activeGroup.stories.length - 1) {
      setStoryIdx(storyIdx + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(groupIdx + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIdx > 0) {
      setStoryIdx(storyIdx - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(groupIdx - 1);
      setStoryIdx(groups[groupIdx - 1].stories.length - 1);
    }
  };

  // Auto advance
  useEffect(() => {
    if (activeStory.type === 'image') {
      const timer = setTimeout(goNext, 5000);
      return () => clearTimeout(timer);
    }
  }, [groupIdx, storyIdx, activeStory]);

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error('Sign in to like stories');
      return;
    }
    const hasLiked = activeStory.likes?.includes(currentUserId);
    if (hasLiked) return;
    
    // Optimistic UI update could be done here
    try {
      await updateDoc(doc(db, 'stories', activeStory.id), {
        likes: arrayUnion(currentUserId)
      });
      activeStory.likes = [...(activeStory.likes || []), currentUserId];
      toast.success('Liked!', { icon: '❤️' });
    } catch(err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!currentUserId || activeStory.authorId !== currentUserId) return;
    if (!window.confirm("Delete this status?")) return;
    
    try {
      await deleteDoc(doc(db, 'stories', activeStory.id));
      toast.success("Status deleted");
      onClose();
      // The parent StoryBar will refresh on close or we could pass a refresh callback
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete status");
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-black flex items-center justify-center touch-none">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
      
      {/* Container */}
      <div className="relative w-full max-w-[420px] h-full sm:h-[85vh] bg-black sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col items-center justify-center border border-white/5">
        
        {/* Progress bars */}
        <div className="absolute top-6 inset-x-6 flex gap-1.5 z-30">
          {activeGroup.stories.map((_: any, i: number) => (
            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                style={{ 
                  width: i < storyIdx ? '100%' : i === storyIdx ? '100%' : '0%',
                  transitionDuration: i === storyIdx && activeStory.type === 'image' ? '5s' : '0s' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-10 inset-x-6 flex justify-between items-center z-30">
          <div className="flex items-center gap-3 bg-black/40 p-2 ltr:pr-5 rtl:pl-5 rounded-full backdrop-blur-xl border border-white/10 group">
            <img src={activeGroup.photoURL} className="w-9 h-9 rounded-full border-2 border-primary/50 object-cover" alt="" />
            <div>
              <span className="text-white font-black text-xs uppercase tracking-widest block">{activeGroup.displayName}</span>
              <p className="text-white/50 text-[9px] font-bold uppercase tracking-tight">{new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeStory.authorId === currentUserId && (
              <button onClick={handleDelete} className="p-2.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all border border-red-500/30 backdrop-blur-md">
                <X className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md text-white border border-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media */}
        <div className="w-full h-full relative group/media" onClick={goNext}>
          {activeStory.type === 'image' ? (
            <img src={activeStory.mediaUrl} className="w-full h-full object-cover select-none" alt="" />
          ) : (
            <video 
              src={activeStory.mediaUrl} 
              autoPlay 
              playsInline 
              muted 
              preload="auto"
              onEnded={goNext} 
              className="w-full h-full object-cover bg-black select-none" 
            />
          )}

          {/* Caption Overlay */}
          {activeStory.caption && (
            <div className="absolute bottom-32 inset-x-8 z-30 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl">
                <p className="text-white text-sm font-bold leading-relaxed tracking-tight text-center drop-shadow-lg">
                  {activeStory.caption}
                </p>
              </div>
            </div>
          )}

          {/* Attachment Link */}
          {activeStory.attachmentUrl && (
            <div className="absolute bottom-16 inset-x-8 z-40 flex justify-center" onClick={(e) => e.stopPropagation()}>
              <a 
                href={activeStory.attachmentUrl.startsWith('http') ? activeStory.attachmentUrl : `https://${activeStory.attachmentUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-3.5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-white/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                Learn More
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Touch zones */}
          <div className="absolute inset-y-0 inset-s-0 w-1/4 z-20" onClick={(e) => { e.stopPropagation(); goPrev(); }} />
          <div className="absolute inset-y-0 inset-e-0 w-1/4 z-20" onClick={(e) => { e.stopPropagation(); goNext(); }} />
        </div>

        {/* Footer actions */}
        <div className="absolute bottom-10 inset-e-6 flex flex-col gap-4 z-40">
          <button 
            onClick={handleLike} 
            className="flex flex-col items-center gap-1.5"
          >
            <div className={`p-4 rounded-full backdrop-blur-xl border border-white/10 transition-all ${activeStory.likes?.includes(currentUserId) ? 'bg-pink-500 text-white shadow-xl shadow-pink-500/20' : 'bg-black/40 text-white hover:bg-pink-500/50 hover:scale-110'}`}>
              <Heart className={`w-6 h-6 ${activeStory.likes?.includes(currentUserId) ? 'fill-current' : ''}`} />
            </div>
            {activeStory.likes?.length > 0 && <span className="text-white font-black text-[10px] drop-shadow-md tracking-widest">{activeStory.likes.length}</span>}
          </button>
        </div>

      </div>
    </div>
  );
}
