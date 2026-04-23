import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';

interface BecomeExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BecomeExpertModal({ isOpen, onClose }: BecomeExpertModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    expertise: '',
    experience: '',
    bio: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Send application to Firestore
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const { auth } = await import('../firebase');
      
      await addDoc(collection(db, 'expertApplications'), {
        ...formData,
        userId: auth.currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Close after 3 seconds of success message
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ name: '', email: '', expertise: '', experience: '', bio: '' });
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      setIsSubmitting(false);
      alert('Failed to submit application. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          />
          
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative transform overflow-hidden rounded-2xl bg-[#1a1a2e]/95 border border-[#4fa596]/20 text-start shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl backdrop-blur-md"
              >
                {/* Header */}
                <div className="p-6 border-b border-[#4fa596]/10 flex justify-between items-center bg-linear-to-r from-[#4fa596]/10 to-transparent">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-[#4fa596] to-[#60bba9]">
                      Become an Expert
                    </span>
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {isSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 bg-[#4fa596]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Send className="w-10 h-10 text-[#4fa596]" />
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-2">Application Submitted!</h4>
                      <p className="text-gray-300">
                        Thank you for your interest in joining Urkio as an expert. Our management team will review your application and get back to you shortly.
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <p className="text-gray-300 mb-6">
                        Join our growing community of professionals and share your knowledge with learners worldwide. Please fill out the form below to apply.
                      </p>
                      <form onSubmit={handleSubmit} className="space-y-4 text-start">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                            <input
                              type="text"
                              name="name"
                              required
                              value={formData.name}
                              onChange={handleChange}
                              className="w-full bg-[#0a0a16]/50 border border-[#4fa596]/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4fa596]/50 focus:border-transparent transition-all"
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address *</label>
                            <input
                              type="email"
                              name="email"
                              required
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full bg-[#0a0a16]/50 border border-[#4fa596]/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4fa596]/50 focus:border-transparent transition-all"
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Area of Expertise *</label>
                            <input
                              type="text"
                              name="expertise"
                              required
                              value={formData.expertise}
                              onChange={handleChange}
                              className="w-full bg-[#0a0a16]/50 border border-[#4fa596]/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4fa596]/50 focus:border-transparent transition-all"
                              placeholder="e.g. Yoga, Web Development, Marketing"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Years of Experience *</label>
                            <select
                              name="experience"
                              required
                              value={formData.experience}
                              onChange={handleChange}
                              className="w-full bg-[#0a0a16]/50 border border-[#4fa596]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#4fa596]/50 focus:border-transparent transition-all"
                            >
                              <option value="" disabled className="text-gray-500">Select experience</option>
                              <option value="1-3">1-3 years</option>
                              <option value="3-5">3-5 years</option>
                              <option value="5-10">5-10 years</option>
                              <option value="10+">10+ years</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Brief Bio *</label>
                          <textarea
                            name="bio"
                            required
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-[#0a0a16]/50 border border-[#4fa596]/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4fa596]/50 focus:border-transparent transition-all resize-none"
                            placeholder="Tell us about your background, achievements, and why you want to become an expert on Urkio..."
                          />
                        </div>

                        <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-[#1a1a2e]/95 pb-2 -mx-6 px-6 shadow-[0_-10px_10px_-10px_rgba(0,0,0,0.5)]">
                          <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-linear-to-r from-[#4fa596] to-[#60bba9] text-white font-medium hover:from-[#3d8c7c] hover:to-[#4fa596] transition-all shadow-lg shadow-[#4fa596]/25 flex items-center justify-center min-w-[140px]"
                          >
                            {isSubmitting ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              'Submit Application'
                            )}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
