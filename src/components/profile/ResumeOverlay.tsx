import React, { useState, useEffect } from 'react';
import { X, Award, BookOpen, Briefcase, Calendar, Link as LinkIcon, ShieldCheck, Mail, MapPin, Star, Zap, Globe, Clock, Activity } from 'lucide-react';
import { GlassButton } from '../GlassButton';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import clsx from 'clsx';

interface ResumeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  expert: any;
}

export const ResumeOverlay: React.FC<ResumeOverlayProps> = ({ isOpen, onClose, expert }) => {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && expert?.uid) {
      fetchAvailability();
    }
  }, [isOpen, expert?.uid]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      // Fetching from 'availability' subcollection
      const q = query(
        collection(db, 'users', expert.uid, 'availability'),
        where('status', '==', 'available'),
        where('start', '>', Timestamp.now()),
        orderBy('start', 'asc'),
        limit(5)
      );
      const snap = await getDocs(q);
      const slots = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAvailability(slots);
    } catch (err) {
      console.error("Availability fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 sm:p-10">
      {/* Immersive Backdrop */}
      <div 
        className="absolute inset-0 bg-[#080a0f]/95 backdrop-blur-3xl animate-in fade-in duration-700" 
        onClick={onClose}
      />

      {/* Main Dossier Container */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0b0e14] border border-white/10 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-12 duration-1000">
        
        {/* Dynamic Header Section */}
        <div className="relative h-64 shrink-0 overflow-hidden">
          <img 
            src={expert.coverPhoto || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80'} 
            className="w-full h-full object-cover opacity-20 scale-110 group-hover:scale-100 transition-transform duration-[3s]" 
            alt="Dossier Cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0b0e14] via-[#0b0e14]/40 to-transparent" />
          
          {/* Close Action */}
          <button 
            onClick={onClose}
            className="absolute top-10 right-10 size-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all hover:rotate-90 flex items-center justify-center z-50 group"
          >
            <X className="size-6 transition-transform group-hover:scale-110" />
          </button>

          {/* Profile Identity Overlay */}
          <div className="absolute -bottom-12 left-12 flex items-end gap-10">
            <div className="size-40 rounded-5xl p-1.5 bg-linear-to-tr from-[#a8c8ff] to-[#4c75ff] shadow-2xl shadow-blue-500/30 overflow-hidden rotate-2">
                <img 
                  src={expert.photoURL || `https://ui-avatars.com/api/?name=${expert.displayName}&background=080a0f&color=a8c8ff`} 
                  className="w-full h-full object-cover rounded-4xl -rotate-2 scale-110"
                  alt={expert.displayName}
                />
            </div>
            <div className="pb-6">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-4xl font-black text-white italic tracking-tighter">
                  {expert.displayName}
                </h2>
                <div className="flex bg-[#a8c8ff]/10 border border-[#a8c8ff]/20 rounded-full px-3 py-1 items-center gap-2">
                   <ShieldCheck className="size-4 text-[#a8c8ff]" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-[#a8c8ff]">Verified Expert</span>
                </div>
              </div>
              <p className="text-[11px] font-black tracking-[0.3em] uppercase text-white/40 leading-none">
                {expert.primaryRole || 'Clinical Lead'} • {expert.experienceYears || '12'}+ Years Residency
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Intelligence Core */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-16 pt-24 pb-16 space-y-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Primary Dossier Info */}
            <div className="lg:col-span-12">
               <section className="bg-white/2 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden group">
                  <div className="absolute -top-20 -right-20 size-60 bg-[#a8c8ff]/5 rounded-full blur-[80px]" />
                  <h3 className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-8">
                    <Briefcase className="size-4 text-[#a8c8ff]" />
                    Professional Directive
                  </h3>
                  <p className="text-xl font-medium text-msgr-outline-variant leading-relaxed tracking-tight italic">
                    "{expert.applicationLetter || 'Commitment to architectural healing and neural synchronization within the Urkio framework. Specialized in clinical residency and premium patient resonance.'}"
                  </p>
               </section>
            </div>

            {/* Sub-Intelligence Grids */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-10">
               
               {/* Credentials */}
               <section className="bg-[#0f111a] border border-white/5 rounded-[3rem] p-10 shadow-xl">
                 <h3 className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-10">
                    <Award className="size-4 text-[#a8c8ff]" />
                    Metadata & Registry
                 </h3>
                 <div className="space-y-4">
                    {[
                      { label: 'Registry ID', value: expert.npiNumber || 'NP-09923-Z' },
                      { label: 'Neural Rating', value: `${expert.rating || '4.9'} Resonance` },
                      { label: 'Core Education', value: expert.education || 'Urkio High Academy' },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center px-6 py-5 rounded-2xl bg-white/2 border border-white/5">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#5b616e]">{row.label}</span>
                        <span className="text-[11px] font-bold text-white tracking-tight">{row.value}</span>
                      </div>
                    ))}
                 </div>
               </section>

               {/* Stats / Engagement */}
               <section className="bg-[#0f111a] border border-white/5 rounded-[3rem] p-10 shadow-xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-[#4c75ff]/5 opacity-20 pointer-events-none" />
                 <h3 className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-10">
                    <Activity className="size-4 text-[#ffb4ab]" />
                    Resonance Stats
                 </h3>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-4xl bg-white/2 border border-white/10 text-center">
                       <p className="text-3xl font-black text-white tabular-nums mb-1 tracking-tighter">{expert.completedSessions || '850'}+</p>
                       <p className="text-[9px] font-black text-[#5b616e] uppercase tracking-widest">Sessions</p>
                    </div>
                    <div className="p-6 rounded-4xl bg-white/2 border border-white/10 text-center">
                       <p className="text-3xl font-black text-[#a8c8ff] tabular-nums mb-1 tracking-tighter">99%</p>
                       <p className="text-[9px] font-black text-[#5b616e] uppercase tracking-widest">Success Rate</p>
                    </div>
                 </div>
                 <div className="mt-8 p-6 rounded-4xl bg-[#a8c8ff]/5 border border-[#a8c8ff]/10 flex items-center justify-between">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Urkio Senior Grade</span>
                    <Zap className="size-4 text-[#a8c8ff] fill-current" />
                 </div>
               </section>

               {/* Specializations - Full Width */}
               <section className="md:col-span-2 bg-[#0f111a] border border-white/5 rounded-[3rem] p-10">
                  <h3 className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-8">
                    <Star className="size-4 text-[#a8c8ff]" />
                    Clinical Specializations
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {(expert.specialties || ['Neural Resilience', 'Crisis Sync', 'Architectural Healing', 'Human Dev']).map((s: string, i: number) => (
                      <span key={i} className="px-6 py-3 rounded-xl bg-white/2 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:border-[#a8c8ff]/40 transition-all cursor-crosshair">
                        {s}
                      </span>
                    ))}
                  </div>
               </section>
            </div>

            {/* Live Availability Sidebar */}
            <aside className="lg:col-span-4 space-y-10">
               <section className="bg-[#141820] border-2 border-[#a8c8ff]/20 rounded-6xl p-10 shadow-2xl relative">
                  <div className="absolute -top-4 -right-4 size-12 bg-[#a8c8ff] rounded-full flex items-center justify-center text-[#080a0f] shadow-lg animate-pulse">
                     <Clock className="size-6" />
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-10">Live Schedule</h3>
                  
                  <div className="space-y-4">
                    {loading ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                      ))
                    ) : availability.length > 0 ? (
                      availability.map((slot) => (
                        <button 
                          key={slot.id}
                          className="w-full flex items-center justify-between p-5 rounded-3xl bg-white/2 border border-white/10 hover:border-[#a8c8ff] hover:bg-white/5 transition-all group"
                        >
                          <div className="text-left">
                            <p className="text-[11px] font-black text-white uppercase tracking-tighter">{formatDate(slot.start)}</p>
                            <p className="text-[9px] font-bold text-[#5b616e] uppercase tracking-widest">Duration: 50m</p>
                          </div>
                          <ChevronRight className="size-4 text-[#5b616e] group-hover:text-[#a8c8ff] transition-all" />
                        </button>
                      ))
                    ) : (
                      <div className="py-12 border border-dashed border-white/5 rounded-4xl text-center">
                        <Calendar className="size-10 text-msgr-on-surface-variant mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#5b616e]">No Real-time Slots</p>
                        <p className="text-[8px] font-bold text-msgr-on-surface-variant uppercase mt-2">Check back in T-minus 2 hours</p>
                      </div>
                    )}
                  </div>

                  <p className="mt-8 text-[9px] font-bold text-[#5b616e] uppercase tracking-widest leading-relaxed text-center">
                    All times synchronization via <span className="text-white">Urkio Standard Time (UTC)</span>
                  </p>
               </section>

               <div className="bg-[#0f111a] border border-white/5 rounded-5xl p-8 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Session Rate</p>
                    <p className="text-2xl font-black text-white tracking-widest ">$120<span className="text-sm text-[#5b616e]">/Resonance</span></p>
                  </div>
                  <div className="size-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                     <Globe className="size-6" />
                  </div>
               </div>
            </aside>

          </div>
        </div>

        {/* Tactical Footer Architecture */}
        <footer className="h-32 px-16 bg-[#0b0e14]/80 backdrop-blur-3xl border-t border-white/10 flex items-center justify-between gap-12 relative z-50">
           <div className="items-center gap-6 hidden sm:flex">
              <div className="size-12 rounded-full border-2 border-white/5 flex items-center justify-center bg-white/2 text-[#a8c8ff]">
                 <Users className="size-6" />
              </div>
              <div>
                <p className="text-[11px] font-black text-white tracking-tight uppercase">Premium Residency</p>
                <p className="text-[9px] font-bold text-[#5b616e] uppercase tracking-[0.2em]">Unlimited Clinical Access</p>
              </div>
           </div>

           <div className="flex items-center gap-6 w-full sm:w-auto">
              <button 
                onClick={onClose}
                className="flex-1 sm:px-12 h-16 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] text-[#5b616e] hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
              >
                Abort Dossier
              </button>
              <button 
                className="flex-1 sm:px-16 h-16 rounded-3xl bg-white text-[#080a0f] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#a8c8ff] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-[#a8c8ff]/20"
              >
                Initiate Booking
              </button>
           </div>
        </footer>

      </div>
    </div>
  );
};

// Re-using same icons or imports from lucide-react as needed
const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
