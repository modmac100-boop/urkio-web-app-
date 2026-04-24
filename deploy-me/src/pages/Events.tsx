import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Calendar, Video, BookOpen, Star, MessageSquare, Plus, X, ExternalLink, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, Unlock, ShieldCheck } from 'lucide-react';
import { UrkioMockData } from '../mockData';
import { EventDetailsModal } from '../components/EventDetailsModal';

export function Events({ user, userData }: { user: any, userData: any }) {
  console.log("Events component rendering. User:", user?.uid, "UserData role:", userData?.role);

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInjectingMock, setIsInjectingMock] = useState(false);
  const [injectStatus, setInjectStatus] = useState<string | null>(null);
  
  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('session');
  const [date, setDate] = useState('');
  const [link, setLink] = useState('');
  const [price, setPrice] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [unlockedCourseIds, setUnlockedCourseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('urkio_unlocked_courses');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing unlocked courses from localStorage:", e);
      return [];
    }
  });
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [courseToUnlock, setCourseToUnlock] = useState<any | null>(null);

  useEffect(() => {
    localStorage.setItem('urkio_unlocked_courses', JSON.stringify(unlockedCourseIds));
  }, [unlockedCourseIds]);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    const q = query(collection(db, 'reviews'), where('eventId', '==', selectedEvent.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsData);
    });
    return () => unsubscribe();
  }, [selectedEvent]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title || !description || !date) return;

    try {
      setIsUploadingMedia(true);
      let mediaUrl = '';
      
      if (mediaFile) {
        const storageRef = ref(storage, `events/${user.uid}/${Date.now()}_${mediaFile.name}`);
        const snapshot = await uploadBytes(storageRef, mediaFile);
        mediaUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'events'), {
        creatorId: user.uid,
        creatorName: userData?.displayName || user.email,
        creatorPhoto: userData?.photoURL || user.photoURL || '',
        title,
        description,
        type,
        date: new Date(date).toISOString(),
        link: link || '',
        price: price ? parseFloat(price) : 0,
        mediaUrl: mediaUrl || '',
        rating: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString()
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setType('session');
      setDate('');
      setLink('');
      setPrice('');
      setMediaFile(null);
    } catch (error) {
      console.error("Error creating event:", error);
      setError("Failed to create event. Please try again.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setShowDeleteModal(eventId);
  };

  const confirmDeleteEvent = async () => {
    if (!showDeleteModal) return;
    try {
      await deleteDoc(doc(db, 'events', showDeleteModal));
      if (selectedEvent?.id === showDeleteModal) setSelectedEvent(null);
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setShowDeleteModal(null);
    }
  };

  const handleInjectMockEvents = async () => {
    setIsInjectingMock(true);
    setInjectStatus("Starting injection...");
    setError(null);
    
    try {
      const mockEvents = UrkioMockData.events;
      
      if (!mockEvents || mockEvents.length === 0) {
        throw new Error("No mock events found in UrkioMockData.");
      }

      for (const event of mockEvents) {
        if (!user?.uid) {
           throw new Error("User must be logged in to inject events.");
        }
        setInjectStatus(`Injecting: ${event.title}...`);
        
        await addDoc(collection(db, 'events'), {
          ...event,
          creatorId: user.uid,
          creatorName: userData?.displayName || user.email || 'Anonymous',
          creatorPhoto: userData?.photoURL || user.photoURL || '',
          createdAt: new Date().toISOString()
        });
      }
      
      setInjectStatus("Injection successful!");
    } catch (err: any) {
      console.error("Error injecting mock events:", err);
      setError(`Failed to inject mock events: ${err.message}`);
      setInjectStatus("Injection failed.");
    } finally {
      setIsInjectingMock(false);
      setTimeout(() => setInjectStatus(null), 3000);
    }
  };


  const handleSubmitReview = async (e: React.FormEvent) => {
    // This logic is now handled in EventDetailsModal
  };

  const getTypeIcon = (eventType: string, isLocked: boolean = false) => {
    if (isLocked) return <Lock className="w-5 h-5 text-slate-400" />;
    switch (eventType) {
      case 'course': return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case 'live_stream': return <Video className="w-5 h-5 text-red-500" />;
      default: return <Calendar className="w-5 h-5 text-teal-500" />;
    }
  };

  const handleEventClick = (event: any) => {
    console.log("Event clicked:", event.title, "Type:", event.type, "ID:", event.id);
    const isSuperAdmin = user?.email === 'urkio@urkio.com' || ['founder', 'admin', 'management'].includes(userData?.role?.toLowerCase() || '');
    if (event.type === 'course' && !unlockedCourseIds.includes(event.id) && !isSuperAdmin) {
      console.log("Course is locked. Showing unlock modal for:", event.id);
      setCourseToUnlock(event);
      return;
    }
    console.log("Course is unlocked or not a course or user is admin. Showing details modal.");
    setSelectedEvent(event);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    console.log("Attempting to unlock course:", courseToUnlock?.id, "with code:", unlockCode);
    const validCodes = [...(UrkioMockData.validHealingCodes || []), 'URKIO_ADMIN_2024', 'URKIO2024', 'URKIO_FOUNDER'];
    if (validCodes.includes(unlockCode)) {
      console.log("Unlock successful!");
      const newUnlocked = [...unlockedCourseIds, courseToUnlock.id];
      setUnlockedCourseIds(newUnlocked);
      setSelectedEvent(courseToUnlock);
      setCourseToUnlock(null);
      setUnlockCode('');
    } else {
      console.log("Invalid unlock code.");
      setUnlockError('Invalid code. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-black text-on-surface dark:text-zinc-100 mb-2">Courses & Sessions</h1>
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Discover live streams, clinical courses, and architectural sessions from experts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleInjectMockEvents}
            disabled={isInjectingMock}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors border border-indigo-100 disabled:opacity-50"
            aria-label="Load mock events for testing"
          >
            <ShieldCheck className="w-4 h-4" />
            {isInjectingMock ? (injectStatus || 'Loading...') : 'Load Mock Events'}
          </button>
          {injectStatus && (
            <span className="text-xs font-medium text-indigo-500 animate-pulse">
              {injectStatus}
            </span>
          )}
          {(userData?.role === 'specialist' || 
            userData?.role === 'admin' || 
            userData?.role === 'management' || 
            userData?.role === 'founder' || 
            userData?.email === 'urkio@urkio.com' ||
            user?.email === 'urkio@urkio.com') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-ur-primary text-white rounded-xl font-headline font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {events.map(event => (
          <div 
            key={event.id} 
            className="bg-white dark:bg-zinc-900 rounded-4xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-col group relative overflow-hidden"
            onClick={() => handleEventClick(event)}
          >
            {/* Type Badge */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                {getTypeIcon(event.type, event.type === 'course' && !unlockedCourseIds.includes(event.id))}
                <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                  {event.type === 'course' && !unlockedCourseIds.includes(event.id) ? 'Locked Course' : event.type.replace('_', ' ')}
                </span>
              </div>
              
              {event.ratingCount > 0 && (
                <div className="flex items-center gap-1 text-amber-500">
                  <span className="material-symbols-outlined text-sm font-fill">star</span>
                  <span className="text-xs font-black">{(event.rating || 0).toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-headline font-black text-on-surface dark:text-zinc-100 mb-3 line-clamp-2 group-hover:text-ur-primary transition-colors">{event.title}</h3>
            
            {event.mediaUrl && (
              <div className="mb-4 w-full h-32 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                {event.mediaUrl.includes('.webm') || event.mediaUrl.includes('.mp4') ? (
                  <video src={event.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                ) : (
                  <img src={event.mediaUrl} alt={event.title} className="w-full h-full object-cover" />
                )}
              </div>
            )}
            
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-relaxed line-clamp-3 mb-8 flex-1">{event.description}</p>
            
            <div className="mt-auto pt-6 border-t border-zinc-50 dark:border-zinc-800/50 space-y-4">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                {new Date(event.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={event.creatorPhoto || `https://ui-avatars.com/api/?name=${event.creatorName}`} alt={event.creatorName} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-zinc-900 shadow-sm" />
                  <div className="absolute -bottom-1 -inset-e-1 w-4 h-4 rounded-full bg-ur-primary border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[8px] text-white font-bold">verified</span>
                  </div>
                </div>
                <div className="text-xs">
                  <p className="font-black text-on-surface dark:text-zinc-100 uppercase tracking-wider">{event.creatorName}</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold">Specialist</p>
                </div>
              </div>
            </div>

            {/* Subtle Hover Gradient */}
            <div className="absolute top-0 inset-e-0 w-32 h-32 bg-ur-primary/5 rounded-full blur-3xl -me-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No events scheduled</h3>
          <p className="text-slate-500 dark:text-slate-400">Check back later for new courses and sessions.</p>
        </div>
      )}

      {/* Event Details Modal */}
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
      </AnimatePresence>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Event</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="session">Session</option>
                    <option value="course">Course</option>
                    <option value="live_stream">Live Stream</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link (Optional)</label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Announcement Photo or Video (Optional)</label>
                  <label className="flex items-center gap-2 w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus-within:ring-2 focus-within:ring-teal-500 cursor-pointer">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span className="flex-1 text-sm text-slate-500 truncate">
                      {mediaFile ? mediaFile.name : 'Upload announcement media...'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setMediaFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                   className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 h-32 resize-none"
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                    disabled={isUploadingMedia}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                    disabled={isUploadingMedia}
                  >
                    {isUploadingMedia && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isUploadingMedia ? 'Uploading & Creating...' : 'Create Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showDeleteModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Delete Event?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-6 py-2 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                className="px-6 py-2 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Course Modal */}
      <AnimatePresence mode="wait">
        {courseToUnlock && (
          <motion.div
            key="unlock-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-4xl w-full max-w-md shadow-2xl overflow-hidden border border-white/10 dark:border-slate-800 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative p-8 text-center bg-linear-to-b from-indigo-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
                <button 
                  type="button"
                  onClick={() => {
                    console.log("Closing unlock modal");
                    setCourseToUnlock(null);
                  }}
                  className="absolute top-4 inset-e-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all z-999"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/40 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Lock className="w-8 h-8 text-indigo-600" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Unlock Healing Course</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Enter your access code to start your journey with "<span className="text-indigo-600 font-semibold">{courseToUnlock.title}</span>".</p>

                <form onSubmit={handleUnlock} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      value={unlockCode}
                      onChange={(e) => setUnlockCode(e.target.value.toUpperCase())}
                      placeholder="ENTER_CODE_HERE"
                      className="w-full px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-center text-xl font-mono tracking-widest focus:border-indigo-500 focus:outline-none transition-all shadow-sm uppercase placeholder:text-slate-200 dark:placeholder:text-slate-600 dark:text-white"
                      required
                      autoFocus
                    />
                    {unlockError && (
                      <p className="mt-3 text-sm font-medium text-red-500 flex items-center justify-center gap-1">
                        <X className="w-4 h-4" /> {unlockError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
                  >
                    Unlock Journey
                    <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  
                  <p className="text-xs text-slate-400">
                    Hint: Use mock data codes like HEAL2026 for testing.
                  </p>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
