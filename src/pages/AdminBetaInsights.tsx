/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * URKIO ADMIN: BETA INSIGHTS DASHBOARD
 */

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Zap, MessageSquare, TrendingUp, ShieldAlert, BarChart3, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeedbackLog {
  id: string;
  rating: number;
  aiOrientationUseful: boolean;
  timestamp: any;
  [key: string]: any;
}

export function AdminBetaInsights({ userData }: any) {
  const [feedback, setFeedback] = useState<FeedbackLog[]>([]);
  const [stats, setStats] = useState({
    avgRating: 0,
    aiAccuracy: 0,
    totalSessions: 0
  });

  const isAdmin = userData?.role === 'admin' || userData?.role === 'founder' || userData?.email === 'urkio@urkio.com';

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'feedback_logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FeedbackLog));
      setFeedback(docs);

      // Calculations
      if (docs.length > 0) {
        const docsWithRating = docs.filter(d => typeof d.rating === 'number');
        const totalRating = docsWithRating.reduce((acc, curr) => acc + curr.rating, 0);
        
        const usefulAI = docs.filter(d => d.aiOrientationUseful === true).length;
        
        setStats({
          avgRating: docsWithRating.length > 0 ? Number((totalRating / docsWithRating.length).toFixed(1)) : 0,
          aiAccuracy: Math.round((usefulAI / docs.length) * 100),
          totalSessions: docs.length
        });
      }
    });

    return () => unsub();
  }, [isAdmin]);

  if (!isAdmin) return <div className="p-20 text-center font-black uppercase text-red-500">Access Denied: Founder Only Perimeter</div>;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-zinc-900 p-8 md:p-12 font-body">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 bg-zinc-900 rounded-2xl text-[#00aaff]"><BarChart3 size={24} /></div>
                 <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Management Hub</p>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic">Beta Insights <span className="text-msgr-primary font-light">Edition One</span></h1>
           </div>
           <div className="flex gap-4">
              <div className="bg-white px-8 py-5 rounded-4xl border border-zinc-100 shadow-sm text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-msgr-primary mb-1">Total Pulses</p>
                 <p className="text-2xl font-black">{stats.totalSessions}</p>
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* AI Accuracy Chart */}
            <div className="p-10 bg-white rounded-[3rem] border border-zinc-100 shadow-sm relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-8">AI Orientation Accuracy</h3>
                  <div className="flex items-end gap-2 mb-6">
                     <h4 className="text-6xl font-black italic tracking-tighter text-msgr-primary">{stats.aiAccuracy}%</h4>
                     <TrendingUp className="text-emerald-500 mb-2" size={24} />
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed font-medium">Of experts find the Gemini clinical orientation "High Fidelity" and useful for sessions.</p>
               </div>
               <div className="absolute top-0 end-0 p-10 opacity-5"><Zap size={100} /></div>
            </div>

            {/* Satisfaction Index */}
            <div className="p-10 bg-zinc-900 rounded-[3rem] text-white relative overflow-hidden">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-[#00aaff] mb-8">Expert Satisfaction Index</h3>
               <div className="flex items-end gap-2 mb-6">
                  <h4 className="text-6xl font-black italic tracking-tighter">{stats.avgRating}/5.0</h4>
               </div>
               <div className="w-full bg-white/10 h-2 rounded-full mt-4">
                  <div className="h-full bg-[#00aaff] rounded-full" style={{ width: `${(stats.avgRating / 5) * 100}%` }} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-6 italic">Benchmark for Edition Two: 4.5</p>
            </div>

            {/* Calibration Required */}
            <div className="p-10 bg-[#fff5f5] rounded-[3rem] border border-red-100 relative overflow-hidden">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-8">Critical Priority List</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <ShieldAlert className="text-red-500" size={20} />
                     <p className="text-sm font-bold text-red-900">Agora Handshake Latency</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <ShieldAlert className="text-red-500" size={20} />
                     <p className="text-sm font-bold text-red-900">Bilingual Transcription Drift</p>
                  </div>
               </div>
            </div>
        </div>

        {/* Feedback Feed */}
        <div className="bg-white rounded-[3.5rem] p-12 border border-zinc-100 shadow-sm">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black italic flex items-center gap-3">
                 <MessageSquare className="text-zinc-900" size={20} /> Specialist Feedback Stream
              </h3>
              <p className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Real-Time Telemetry</p>
           </div>
           
           <div className="space-y-6">
              {feedback.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 flex flex-col md:flex-row gap-8 items-start hover:border-msgr-primary transition-all group"
                >
                  <div className="flex flex-col items-center gap-2 shrink-0">
                     <div className={`p-4 rounded-2xl font-black text-xl whitespace-nowrap ${item.aiOrientationUseful ? 'bg-indigo-50 text-msgr-primary' : 'bg-red-50 text-red-500'}`}>
                        {item.aiOrientationUseful ? 'AI ✓' : 'AI ✗'}
                     </div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Ref: {item.sessionId?.substring(0,8)}</p>
                  </div>
                  
                  <div className="flex-1">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="flex gap-1">
                           {[1,2,3,4,5].map(s => (
                             <Zap key={s} size={12} className={item.rating >= s ? 'text-msgr-primary' : 'text-zinc-200'} fill={item.rating >= s ? 'currentColor' : 'none'} />
                           ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">| {item.metadata?.category || 'Clinical'}</span>
                     </div>
                     <p className="text-zinc-700 font-medium leading-relaxed italic">"{item.technicalSuggestions || 'No detailed friction reported.'}"</p>
                  </div>
                  
                  <div className="shrink-0 pt-2">
                     <button className="text-[9px] font-black uppercase tracking-[0.2em] text-msgr-primary opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                        Retrain AI <ChevronRight size={10} />
                     </button>
                  </div>
                </motion.div>
              ))}
              {feedback.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                   <div className="p-8 bg-zinc-50 rounded-full text-zinc-200"><BarChart3 size={40} /></div>
                   <p className="text-zinc-400 font-black uppercase text-xs tracking-widest">Waiting for first clinical pulse...</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
