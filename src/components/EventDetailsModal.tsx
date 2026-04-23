import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Video, BookOpen, Star, MessageSquare, Plus, X, ExternalLink, Trash2, Lock, Unlock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface EventDetailsModalProps {
  selectedEvent: any;
  setSelectedEvent: (event: any | null) => void;
  user: any;
  userData: any;
  handleDeleteEvent?: (eventId: string) => void;
}

export function EventDetailsModal({ selectedEvent, setSelectedEvent, user, userData, handleDeleteEvent }: EventDetailsModalProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedEvent) return;
    const q = query(collection(db, 'reviews'), where('eventId', '==', selectedEvent.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsData);
    });
    return () => unsubscribe();
  }, [selectedEvent]);

  if (!selectedEvent) return null;

  const getTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'course': return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case 'live_stream': return <Video className="w-5 h-5 text-red-500" />;
      default: return <Calendar className="w-5 h-5 text-teal-500" />;
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedEvent) return;
    if (!user) {
      setError("Please sign in to leave a review.");
      return;
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        eventId: selectedEvent.id,
        userId: user.uid,
        userName: userData?.displayName || user.email,
        userPhoto: userData?.photoURL || user.photoURL || '',
        rating: reviewRating,
        comment: reviewComment,
        createdAt: new Date().toISOString()
      });

      const newRatingCount = (selectedEvent.ratingCount || 0) + 1;
      const newRating = (((selectedEvent.rating || 0) * (selectedEvent.ratingCount || 0)) + reviewRating) / newRatingCount;

      await updateDoc(doc(db, 'events', selectedEvent.id), {
        rating: newRating,
        ratingCount: newRatingCount
      });

      setReviewRating(5);
      setReviewComment('');
    } catch (error) {
      console.error("Error submitting review:", error);
      setError("Failed to submit review. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {getTypeIcon(selectedEvent.type)}
            <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{selectedEvent?.type?.replace('_', ' ') || 'Event'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {(handleDeleteEvent && user && (
              selectedEvent.creatorId === user.uid || 
              userData?.role === 'admin' || 
              userData?.role === 'management' || 
              userData?.role === 'founder' || 
              userData?.email === 'urkio@urkio.com' ||
              user?.email === 'urkio@urkio.com'
            )) && (
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Event"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setSelectedEvent(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{selectedEvent.title}</h1>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-6">{selectedEvent.description}</p>
            
            {selectedEvent.mediaUrl && (
              <div className="mb-6 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                {selectedEvent.mediaUrl.includes('.webm') || selectedEvent.mediaUrl.includes('.mp4') ? (
                  <video src={selectedEvent.mediaUrl} className="w-full h-auto max-h-[400px] object-cover" controls playsInline />
                ) : (
                  <img src={selectedEvent.mediaUrl} alt={selectedEvent.title} className="w-full h-auto max-h-[400px] object-cover" />
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-5 h-5 text-teal-600" />
              <span className="font-medium">{new Date(selectedEvent.date).toLocaleString()}</span>
            </div>
            {selectedEvent.price > 0 && (
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-bold text-teal-600">${selectedEvent.price}</span>
              </div>
            )}
            {selectedEvent.link ? (
              <a 
                href={selectedEvent.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors ms-auto"
              >
                Join Event <ExternalLink className="w-4 h-4 ms-1" />
              </a>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`You are now ${selectedEvent.type === 'course' ? 'subscribed to' : 'interested in'} this event!`);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors ms-auto shadow-sm"
              >
                {selectedEvent.type === 'course' ? 'Subscribe' : selectedEvent.type === 'live_stream' ? 'Join Live' : 'Interested'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-2xl">
            <Link to={`/user/${selectedEvent.creatorId}`} onClick={() => setSelectedEvent(null)}>
              <img src={selectedEvent.creatorPhoto || `https://ui-avatars.com/api/?name=${selectedEvent.creatorName}`} alt={selectedEvent.creatorName} className="w-12 h-12 rounded-full hover:opacity-80 transition-opacity" />
            </Link>
            <div>
              <p className="text-sm text-slate-500">Hosted by</p>
              <Link to={`/user/${selectedEvent.creatorId}`} onClick={() => setSelectedEvent(null)} className="font-bold text-slate-900 dark:text-white hover:text-teal-600 transition-colors hover:underline">
                {selectedEvent.creatorName}
              </Link>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Reviews</h3>
              {selectedEvent.ratingCount > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-current" />
                  <span className="font-bold text-slate-900 dark:text-white">{selectedEvent.rating.toFixed(1)}</span>
                  <span className="text-slate-500">({selectedEvent.ratingCount})</span>
                </div>
              )}
            </div>

            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

            {user && selectedEvent.creatorId !== user.uid && (
              <form onSubmit={handleSubmitReview} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-white">Leave a Review</h4>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'text-amber-500 fill-current' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none h-24"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                >
                  Submit Review
                </button>
              </form>
            )}

            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <Link to={`/user/${review.userId}`} onClick={() => setSelectedEvent(null)}>
                        <img src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}`} alt={review.userName} className="w-8 h-8 rounded-full hover:opacity-80 transition-opacity" />
                      </Link>
                      <div>
                        <Link to={`/user/${review.userId}`} onClick={() => setSelectedEvent(null)} className="font-medium text-slate-900 dark:text-white text-sm hover:text-teal-600 hover:underline">
                          {review.userName}
                        </Link>
                        <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm mt-2">{review.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-slate-500 text-center py-4">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
