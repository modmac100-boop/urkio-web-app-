/**
 * Urkio Clinical Command Center
 * Advanced Expert Dashboard featuring relational patient data, 
 * real-time sentiment analytics, and reactive 2D animations.
 */

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Activity, 
  Shield, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Video, 
  Settings, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Save,
  Navigation,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAnimationOrchestrator } from '../utils/AnimationOrchestrator';

// Custom SVG Chart Component for Live Insights
const SentimentChart = ({ data }: { data: number[] }) => {
  const points = data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - (val * 100)}`).join(' ');
  
  return (
    <div className="w-full h-32 relative group">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Shadow path */}
        <motion.path
          d={`M 0,100 L ${points} L 100,100 Z`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          fill="url(#chartGradient)"
        />
        {/* Main path */}
        <motion.polyline
          points={points}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        {/* Data points */}
        {data.map((val, i) => (
          <circle 
            key={i} 
            cx={(i / (data.length - 1)) * 100} 
            cy={100 - (val * 100)} 
            r="1.5" 
            fill="white" 
            stroke="#8b5cf6" 
            strokeWidth="1"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex justify-between pointer-events-none">
        {['Day 1', 'Day 3', 'Day 5', 'Day 7'].map(label => (
          <span key={label} className="text-[8px] font-black text-zinc-400 self-end mt-2 uppercase tracking-widest">{label}</span>
        ))}
      </div>
    </div>
  );
};

// Animation Preview Component
const AnimationPreview = ({ sentiment }: { sentiment: number }) => {
  const currentState = useAnimationOrchestrator(sentiment);
  
  const getLabel = () => {
    if (sentiment <= 0.3) return 'Soothing Guide (Stress Detected)';
    if (sentiment <= 0.7) return 'Active Listener (Stable)';
    return 'Success Catalyst (Positive)';
  };

  const getColor = () => {
    if (sentiment <= 0.3) return 'from-orange-400 to-rose-600';
    if (sentiment <= 0.7) return 'from-indigo-400 to-violet-600';
    return 'from-emerald-400 to-teal-600';
  };

  return (
    <div className="relative group aspect-square rounded-[3rem] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
      <div className={`absolute inset-0 bg-linear-to-br transition-all duration-1000 opacity-20 ${getColor()}`} />
      
      {/* 2D Character Animation Placeholder (Representation of Stitch Asset) */}
      <div className="absolute inset-x-0 bottom-0 top-1/4 flex items-center justify-center p-12">
        <motion.div 
          animate={{ 
            scale: sentiment <= 0.3 ? [1, 1.05, 1] : 1,
            rotate: sentiment > 0.7 ? [0, 5, -5, 0] : 0,
            y: [0, -10, 0]
          }}
          transition={{ 
            duration: sentiment <= 0.3 ? 2 : 4, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="w-48 h-48 bg-white/10 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-8xl text-white font-fill opacity-90 drop-shadow-2xl">
            {sentiment <= 0.3 ? 'self_improvement' : sentiment <= 0.7 ? 'neurology' : 'celebration'}
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 inset-x-4">
        <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em] mb-0.5">Live AI Response</p>
          <p className="text-xs font-black text-white italic">{getLabel()}</p>
        </div>
      </div>
    </div>
  );
};

export function ExpertDashboard({ user, userData }: any) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sentiment, setSentiment] = useState(0.65);
  const [history, setHistory] = useState([0.4, 0.55, 0.45, 0.7, 0.6, 0.8, 0.65]);
  const [isSecure, setIsSecure] = useState(true);
  const [stats, setStats] = useState({ cases: 0, appts: 0, reports: 0, courses: 0 });

  useEffect(() => {
    if (!user?.uid) return;

    const qCases = query(collection(db, 'cases'), where('authorId', '==', user.uid));
    const qAppts = query(collection(db, 'appointments'), where('expertId', '==', user.uid));
    const qReps = query(collection(db, 'confidential_reports'), where('authorId', '==', user.uid));
    const qCourses = query(collection(db, 'events'), where('expertId', '==', user.uid), where('type', '==', 'course'));

    const unsubCases = onSnapshot(qCases, snap => setStats(prev => ({ ...prev, cases: snap.size })));
    const unsubAppts = onSnapshot(qAppts, snap => setStats(prev => ({ ...prev, appts: snap.size })));
    const unsubReps = onSnapshot(qReps, snap => setStats(prev => ({ ...prev, reports: snap.size })));
    const unsubCourses = onSnapshot(qCourses, snap => setStats(prev => ({ ...prev, courses: snap.size })));

    return () => { unsubCases(); unsubAppts(); unsubReps(); unsubCourses(); };
  }, [user.uid]);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1b1c1a] font-body flex flex-col">
      {/* Navigation Header */}
      <nav className="h-16 w-full bg-white border-b border-zinc-100 flex justify-between items-center px-10">
        <div className="flex items-center gap-10">
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
             <span className="text-xl font-black tracking-tighter text-[#004e99] dark:text-blue-400">URKIO</span>
             <span className="text-zinc-400 font-light ms-1 uppercase tracking-widest text-[10px]">Command Center</span>
           </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
             <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Relational DB Active</span>
           </div>
           <button className="p-3 bg-zinc-100 rounded-2xl hover:bg-zinc-200 transition-colors"><Settings size={18} /></button>
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter italic text-zinc-900 leading-none">Clinical Insights</h1>
            <p className="text-zinc-500 font-medium mt-2 text-base">AI-Augmented Sentiment Analysis & Case Management</p>
          </div>
          <button className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all">
            <Video size={16} /> Start Secure Session
          </button>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Cases', val: stats.cases, icon: Shield, color: 'text-[#004e99]' },
            { label: 'Total Sessions', val: stats.appts, icon: Calendar, color: 'text-ur-primary' },
            { label: 'Published Courses', val: stats.courses, icon: BookOpen, color: 'text-emerald-500' },
            { label: 'Reports', val: stats.reports, icon: MessageSquare, color: 'text-amber-500' }
          ].map(stat => (
            <div key={stat.label} className="bg-white p-6 rounded-4xl border border-zinc-100 shadow-sm">
              <stat.icon className={`size-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-black italic text-zinc-900 leading-none">{stat.val}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Insights */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#004e99]/10 flex items-center justify-center">
                    <TrendingUp className="text-[#004e99]" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic">Emotional Sentiment Trend</h3>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mt-1">Grounding: Clinical Sessions Vault</p>
                  </div>
                </div>
                <div className="text-end">
                   <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Current Pulse</p>
                   <p className="text-4xl font-black italic text-ur-primary">{Math.round(sentiment * 100)}%</p>
                </div>
              </div>

              <SentimentChart data={history} />

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-50">
                {[
                  { label: 'Avg Mood', val: 'Stable', sub: 'Neutral Range' },
                  { label: 'Concern Level', val: 'Low', sub: 'Decreasing Trend' },
                  { label: 'AI Prediction', val: 'Positive', sub: 'Growth Phase' },
                ].map(stat => (
                  <div key={stat.label}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{stat.label}</p>
                    <p className="text-lg font-black italic">{stat.val}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Homii Journal Summary */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
              <h3 className="text-lg font-black italic flex items-center gap-2">
                <MessageSquare className="text-ur-primary" size={20} /> Homii Journal Summary
              </h3>
              <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 italic text-zinc-600 text-sm leading-relaxed relative">
                "Over the last 48 hours, the patient has mentioned improved sleep hygiene but continues to express anxiety regarding professional transitions. Semantic matching suggests a recurring pattern of 'Imposter Syndrome' compared to sessions in Month 1."
                <div className="mt-6 flex flex-wrap gap-2">
                   {['Insomnia', 'Career Stress', 'Progress'].map(tag => (
                     <span key={tag} className="px-4 py-1.5 bg-white border border-zinc-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400">#{tag}</span>
                   ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Animation Preview & Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 px-3">Live Animation Sync</h3>
              <AnimationPreview sentiment={sentiment} />
            </div>

            {/* Specialist Controls */}
            <div className="bg-zinc-900 p-6 rounded-3xl text-white space-y-4">
               <div>
                 <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00aaff] mb-4">Expert Override</h3>
                 <div className="space-y-3">
                    <p className="text-[11px] text-zinc-400 font-medium mb-3">Select a manual animation state to guide the patient's breathing or focus.</p>
                    <select 
                      onChange={(e) => setSentiment(parseFloat(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <option value="0.2">Guided Breathing (Stress)</option>
                      <option value="0.5">Empathetic Listening (Neutral)</option>
                      <option value="0.9">Encourage Growth (Positive)</option>
                    </select>
                 </div>
               </div>

               <div className="pt-6 border-t border-white/5 space-y-3">
                  <button className="w-full bg-white text-zinc-900 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2">
                    <Save size={14} /> Save Clinical Note
                  </button>
                  <div className="flex items-center justify-center gap-4 text-zinc-500 text-[9px] font-black uppercase tracking-widest">
                    <Lock size={12} /> PostgreSQL Encrypted Vault
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const Lock = ({ size, className }: any) => <Shield size={size} className={className} />;
