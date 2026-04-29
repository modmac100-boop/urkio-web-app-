import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, Calendar, Heart, BadgeCheck, Settings, HelpCircle, 
  Star, ChevronRight, Filter, MessageSquare, Briefcase, Award,
  Clock, DollarSign, ExternalLink, ShieldCheck, Phone, Minimize2,
  Zap, ArrowRight
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

export function HealingCenter({ user, userData }: { user: any; userData: any }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { actualTheme: theme } = useTheme();
  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const q = query(collection(db, 'users'), limit(500));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const allowedNames = ['ayat', 'alma', 'abed', 'judy'];
        const filtered = all.filter((u: any) => {
          if (u.isDeleted) return false;
          const name = (u.displayName || '').toLowerCase();
          if (user && u.id === user.uid) return true;
          if (allowedNames.some(n => name.includes(n))) return true;
          
          const role = (u.role || u.primaryRole || u.userType || '').toLowerCase();
          const isExpertRole = ['expert', 'specialist', 'practitioner', 'therapist', 'coach', 'doctor', 'psychologist', 'founder'].some(r => role.includes(r));
          
          return u.verificationStatus === 'approved' || isExpertRole;
        });

        if (filtered.length === 0) {
          setExperts(all.filter((u: any) => !u.isDeleted));
        } else {
          setExperts(filtered);
        }
      } catch (err) {
        console.error("Error fetching experts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, [user]);

  const filteredExperts = experts.filter(e => {
    const roleContent = (e.specialty || e.primaryRole || '').toLowerCase();
    const nameMatch = (e.displayName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || roleContent.includes(selectedCategory.toLowerCase());
    return (nameMatch || roleContent.includes(searchQuery.toLowerCase())) && matchesCategory;
  });

  return (
    <div className={clsx(
      "min-h-screen font-manrope selection:bg-ur-primary/30 transition-all duration-700",
      theme === 'dark' ? "bg-ur-on-surface text-[#e1e2ea]" : "bg-[#fbf9f5] text-[#1A222B]"
    )}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,ital,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&display=swap');
        .font-serif-clinical { font-family: 'Newsreader', serif; }
      `}</style>

      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-ur-primary/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#C8A96E]/5 rounded-full blur-[120px]" />
      </div>

      <header className="relative pt-32 pb-40 px-8 text-center max-w-5xl mx-auto z-10">
         <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-ur-primary/10 border border-ur-primary/20 text-ur-primary text-[10px] font-black uppercase tracking-[0.3em] mb-10">
            <Zap className="size-3 animate-pulse" />
            Global Healing Sanctuary
         </div>
         <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-[0.85] text-inherit mb-12">
            Elite <span className="text-transparent bg-clip-text bg-linear-to-r from-ur-primary to-[#C8A96E]">Practitioners</span> <br />
            for Synergy.
         </h1>
         
         <div className="max-w-3xl mx-auto mt-16 relative group">
            <div className={clsx(
               "flex items-center p-2 rounded-[2.5rem] border transition-all",
               theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-3xl"
            )}>
               <Search className="ml-8 mr-4 size-6 opacity-30" />
               <input 
                 className="bg-transparent border-none focus:ring-0 w-full py-5 text-base font-medium outline-none" 
                 placeholder="Query the syndicate directory..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               <button className="bg-ur-primary text-ur-on-surface px-12 py-5 rounded-full text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                 Filter
               </button>
            </div>
         </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 relative z-20 pb-40">
         {/* Expert Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredExperts.map((expert) => (
               <div 
                 key={expert.id}
                 className={clsx(
                   "group rounded-[3rem] overflow-hidden border transition-all duration-500 hover:-translate-y-2",
                   theme === 'dark' ? "bg-[#10161D] border-white/5 shadow-3xl" : "bg-white border-slate-100 shadow-2xl"
                 )}
               >
                  <div className="relative h-64 overflow-hidden">
                     <img 
                       src={expert.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName || 'Expert')}&background=random&color=fff&size=512`}
                       alt={expert.displayName}
                       className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110"
                     />
                     <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 text-emerald-400">
                           <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                           <span className="text-[8px] font-black uppercase tracking-widest">ACTIVE</span>
                        </div>
                     </div>
                     <div className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-2">
                        <Star className="size-3 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-black text-white">{expert.rating || '4.9'}</span>
                     </div>
                  </div>

                  <div className="p-10">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h3 className="text-2xl font-bold font-serif-clinical tracking-tight">{expert.displayName}</h3>
                           <p className="text-[10px] font-black uppercase tracking-widest text-ur-primary mt-1">{expert.specialty || expert.primaryRole || "Clinical Expert"}</p>
                        </div>
                        <p className="text-lg font-bold">${expert.hourlyRate || '180'}<span className="text-[10px] opacity-40">/hr</span></p>
                     </div>

                     <p className="text-xs opacity-50 italic leading-relaxed mb-10 line-clamp-2">
                        "{expert.bio || "Dedicated to transformative clinical wellness and cognitive architecture."}"
                     </p>

                     {/* FUNCTIONAL BUTTONS - FIXED AS REQUESTED */}
                     <div className="space-y-4">
                        <div className="flex gap-3">
                           <button 
                             onClick={() => navigate(`/expert/${expert.id}?action=book`)}
                             className="flex-[1.2] bg-ur-primary text-ur-on-surface py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-between px-6 hover:brightness-110 transition-all shadow-xl shadow-ur-primary/20"
                           >
                              BOOK NOW <ChevronRight className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => navigate(`/therapy-room/${expert.id}?type=video`)}
                             className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-between px-6 hover:brightness-110 transition-all shadow-xl shadow-emerald-500/20"
                           >
                              INSTANT CALL <Phone className="w-4 h-4" />
                           </button>
                        </div>
                        <div className="flex gap-3">
                           <button 
                             onClick={() => navigate(`/messenger?partnerId=${expert.id}`)}
                             className="flex-1 bg-white/5 border border-white/5 hover:bg-white/10 text-white py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                           >
                              <MessageSquare className="w-4 h-4 opacity-40" /> MESSAGE
                           </button>
                           <button 
                             onClick={() => navigate(`/expert/${expert.id}`)}
                             className="flex-1 bg-white/5 border border-white/5 hover:bg-white/10 text-white py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all"
                           >
                              PROFILE
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </main>
    </div>
  );
}
