/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * URKIO POST-SESSION DEBRIEF (BETA ONE)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { Star, MessageSquare, Zap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface DebriefProps {
  session: any;
  onClose: () => void;
}

export function PostSessionDebrief({ session, onClose }: DebriefProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [aiUseful, setAiUseful] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || aiUseful === null) {
      toast.error(t('debrief.metricsError'));
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Log detailed feedback for Edition Two iteration
      await addDoc(collection(db, 'feedback_logs'), {
        sessionId: session.id,
        expertId: session.expertId || 'unknown',
        patientId: session.userId || 'unknown',
        rating,
        aiOrientationUseful: aiUseful,
        technicalSuggestions: suggestions,
        timestamp: serverTimestamp(),
        metadata: {
          category: session.category,
          distressLevel: session.currentDistressLevel || 'N/A'
        }
      });

      // 2. Flag for AI retraining if not useful
      if (!aiUseful) {
        await updateDoc(doc(db, 'appointments', session.id), {
          aiCalibrationRequired: true,
          calibrationReason: suggestions || 'Expert marked orientation as not useful.'
        });
      }

      toast.success(t('debrief.success'));
      onClose();
    } catch (err) {
      console.error('Debrief failed:', err);
      toast.error(t('debrief.vaultError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative"
      >
        <div className="flex items-center gap-3 mb-8">
           <div className="p-3 bg-indigo-50 rounded-2xl text-[#004e99]"><Zap size={24} /></div>
           <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#004e99]">{t('debrief.pulse')}</p>
              <h2 className="text-2xl font-black italic tracking-tight text-zinc-900">{t('debrief.title')}</h2>
           </div>
        </div>

        <div className="space-y-8">
          {/* Rating */}
          <div className="space-y-4">
             <p className="text-sm font-bold text-zinc-500">{t('debrief.smoothness')}</p>
             <div className="flex gap-4">
               {[1, 2, 3, 4, 5].map((star) => (
                 <button 
                   key={star}
                   onClick={() => setRating(star)}
                   className={`p-4 rounded-2xl transition-all ${rating >= star ? 'bg-amber-100 text-amber-600 scale-110' : 'bg-zinc-50 text-zinc-300'}`}
                 >
                   <Star size={24} fill={rating >= star ? 'currentColor' : 'none'} />
                 </button>
               ))}
             </div>
          </div>

          {/* AI Eval */}
          <div className="space-y-4">
             <p className="text-sm font-bold text-zinc-500">{t('debrief.aiUseful')}</p>
             <div className="flex gap-4">
                <button 
                  onClick={() => setAiUseful(true)}
                  className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${aiUseful === true ? 'border-[#004e99] bg-indigo-50 text-[#004e99]' : 'border-zinc-100 text-zinc-400'}`}
                >
                  {t('debrief.yes')}
                </button>
                <button 
                  onClick={() => setAiUseful(false)}
                  className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${aiUseful === false ? 'border-red-500 bg-red-50 text-red-500' : 'border-zinc-100 text-zinc-400'}`}
                >
                  {t('debrief.no')}
                </button>
             </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-sm font-bold text-zinc-500">
                <MessageSquare size={16} /> {t('debrief.suggestions')}
             </div>
             <textarea 
               value={suggestions}
               onChange={(e) => setSuggestions(e.target.value)}
               placeholder={t('debrief.placeholder')}
               className="w-full h-32 p-6 rounded-3xl bg-zinc-50 border-none text-sm placeholder:text-zinc-300 focus:ring-2 focus:ring-[#004e99] transition-all"
             />
          </div>
        </div>

        <div className="mt-10 flex gap-4">
           <button 
             onClick={onClose}
             className="px-8 py-4 text-xs font-black uppercase text-zinc-400 hover:text-zinc-600 transition-colors"
           >
             {t('debrief.dismiss')}
           </button>
           <button 
             onClick={handleSubmit}
             disabled={isSubmitting}
             className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#004e99] hover:shadow-xl transition-all disabled:opacity-50"
           >
             {isSubmitting ? t('debrief.securing') : t('debrief.complete')}
           </button>
        </div>

        <div className="absolute bottom-4 inset-s-0 inset-e-0 text-center opacity-30 pointer-events-none">
           <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <AlertCircle size={10} /> {t('debrief.engine')}
           </div>
        </div>
      </motion.div>
    </div>
  );
}
