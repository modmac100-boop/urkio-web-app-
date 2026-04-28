import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Calendar, 
  ShieldCheck, 
  Verified, 
  Bell, 
  User as UserIcon,
  Stethoscope,
  BookOpen,
  CircleCheck,
  SearchIcon,
  ArrowRightCircle,
  Star,
  MessageSquare,
  Phone,
  ChevronRight,
  Maximize2,
  Minimize2,
  Zap,
  Award,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

export function ExpertList({ user, userData }: { user: any; userData: any }) {
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
        
        // Filter: me + Ayat, Alma, Abed, Judy + any verified
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
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = (e.displayName || '').toLowerCase().includes(searchLower);
    const specialtyMatch = (e.specialty || e.primaryRole || '').toLowerCase().includes(searchLower);
    const matchesCategory = selectedCategory === 'All' || (e.specialty || '').toLowerCase().includes(selectedCategory.toLowerCase());
    return (nameMatch || specialtyMatch) && matchesCategory;
  });

  return (
    <div className={clsx(
      "min-h-screen font-sans selection:bg-[#30B0D0]/30 transition-all duration-700",
      theme === 'dark' ? "bg-[#050A0F] text-[#e6e2de]" : "bg-[#fbf9f5] text-[#1b1c1a]"
    )}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,ital,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&family=Noto+Serif+SC:wght@200..900&display=swap');
        .font-serif-clinical { font-family: 'Newsreader', serif; }
        .font-manrope { font-family: 'Manrope', sans-serif; }
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
      `}</style>

      {/* Premium Header */}
      <nav className={clsx(
        "fixed top-0 left-0 w-full z-50 flex justify-between items-center px-12 py-6 border-b transition-all",
        theme === 'dark' ? "bg-[#050A0F]/80 backdrop-blur-2xl border-white/5" : "bg-white/80 backdrop-blur-2xl border-slate-200"
      )}>
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="size-10 rounded-xl bg-gradient-to-tr from-[#30B0D0] to-[#C8A96E] flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
             <ShieldCheck className="w-6 h-6 text-[#050A0F]" />
          </div>
          <span className="font-serif-clinical text-2xl font-bold tracking-tighter">URKIO</span>
        </div>
        
        <div className="hidden md:flex items-center gap-12">
          {['Discover', 'Experts', 'Network', 'Library'].map((item) => (
             <button key={item} className={clsx("text-[10px] font-black uppercase tracking-[0.2em] transition-all", item === 'Experts' ? "text-[#30B0D0]" : "opacity-40 hover:opacity-100")}>{item}</button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <Bell className="w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer transition-all" />
          <UserIcon className="w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer transition-all" onClick={() => navigate('/settings')} />
          <button 
            onClick={() => navigate('/verify')}
            className="bg-[#30B0D0] text-[#050A0F] px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#30B0D0]/20"
          >
            Apply as Expert
          </button>
        </div>
      </nav>

      <main className="pt-40 px-8 max-w-[1400px] mx-auto pb-40">
        {/* Search & Hero */}
        <header className="mb-24 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[#C8A96E]/10 border border-[#C8A96E]/20 text-[#C8A96E] text-[9px] font-black uppercase tracking-[0.3em] mb-10 shadow-inner">
             <Zap className="size-3 animate-pulse" />
             Verified Clinical Directory
          </div>
          <h1 className="font-serif-clinical text-6xl md:text-8xl font-bold mb-10 tracking-tighter leading-[0.9]">
             Elite <span className="italic text-[#30B0D0]">Mindscape</span> <br/> Architects.
          </h1>
          
          <div className="relative group max-w-2xl mx-auto mt-16">
             <div className="absolute inset-0 bg-[#30B0D0]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <div className={clsx(
               "relative flex items-center p-2 rounded-[2.5rem] border transition-all",
               theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-2xl"
             )}>
                <Search className="ml-8 mr-4 w-6 h-6 opacity-30" />
                <input 
                  className="bg-transparent border-none focus:ring-0 w-full py-5 text-base font-medium outline-none placeholder:opacity-20" 
                  placeholder="Query by clinical focus or practitioner name..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button className="bg-[#30B0D0] text-[#050A0F] px-12 py-5 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#289CB8] transition-all shadow-xl">
                  Analyze
                </button>
             </div>
          </div>
        </header>

        {loading ? (
           <div className="flex flex-col items-center py-40 gap-6">
              <div className="size-16 rounded-3xl border-4 border-[#30B0D0]/20 border-t-[#30B0D0] animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Scanning Registry...</p>
           </div>
        ) : (
           <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
              {filteredExperts.map((expert) => (
                 <motion.div 
                   key={expert.id}
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   className={clsx(
                     "group rounded-[2rem] md:rounded-[3rem] overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2 border",
                     theme === 'dark' ? "bg-[#10161D] border-white/5 shadow-3xl" : "bg-white border-slate-100 shadow-2xl"
                   )}
                 >
                    {/* Visual Header */}
                    <div className="relative h-48 md:h-64 overflow-hidden bg-slate-900">
                       <img 
                         src={expert.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName || 'Expert')}&background=random&color=fff&size=512`}
                         alt={expert.displayName}
                         className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-[#10161D] via-transparent to-transparent opacity-80" />
                       
                       <div className="absolute top-3 md:top-6 left-3 md:left-6 flex flex-col gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 md:px-4 md:py-2 rounded-full bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 text-emerald-400">
                             <div className="size-1 md:size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                             <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest">ACTIVE BRIDGE</span>
                          </div>
                       </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 md:p-10 flex-1 flex flex-col">
                       <div className="flex flex-col md:flex-row justify-between items-start mb-2">
                          <div>
                             <h3 className="text-sm md:text-2xl font-bold font-serif-clinical tracking-tight group-hover:text-[#30B0D0] transition-colors line-clamp-1">{expert.displayName}</h3>
                             <p className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-[#30B0D0] mt-1 line-clamp-1">{expert.specialty || expert.primaryRole || "Mental Lead"}</p>
                          </div>
                       </div>

                       {/* FUNCTIONAL BUTTONS - COMPACT FOR MOBILE */}
                       <div className="mt-auto space-y-2 md:space-y-4">
                          <button 
                            onClick={() => navigate(`/expert/${expert.id}?action=book`)}
                            className="w-full bg-[#30B0D0] text-[#050A0F] py-2.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[7px] md:text-[10px] uppercase tracking-widest flex items-center justify-between px-4 md:px-6"
                          >
                             BOOK <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => navigate(`/therapy-room/${expert.id}?type=video`)}
                               className="flex-1 bg-emerald-500 text-white py-2 md:py-3.5 rounded-lg md:rounded-2xl font-black text-[6px] md:text-[9px] uppercase tracking-widest"
                             >
                                CALL
                             </button>
                             <button 
                               onClick={() => navigate(`/expert/${expert.id}`)}
                               className="flex-1 bg-white/5 border border-white/5 text-white py-2 md:py-3.5 rounded-lg md:rounded-2xl font-black text-[6px] md:text-[9px] uppercase tracking-widest"
                             >
                                VIEW
                             </button>
                          </div>
                       </div>
                    </div>
                 </motion.div>
              ))}
           </div>
        )}
        
        {/* Recuitment Banner */}
        <section className={clsx(
           "mt-40 rounded-[4rem] p-20 flex flex-col lg:flex-row items-center justify-between gap-16 relative overflow-hidden",
           theme === 'dark' ? "bg-white/2 border border-white/5" : "bg-white shadow-3xl border border-slate-100"
        )}>
           <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[#C8A96E]/10 border border-[#C8A96E]/20 text-[#C8A96E] text-[9px] font-black uppercase tracking-[0.3em] mb-10">
                 <Award className="size-4" />
                 Global Practitioner Network
              </div>
              <h2 className="font-serif-clinical text-5xl font-bold mb-8 tracking-tighter leading-tight">
                 Are you a <span className="italic text-[#30B0D0]">Visionary</span> <br/> Practitioner?
              </h2>
              <p className="text-lg opacity-60 mb-12 leading-relaxed">
                 Join our elite sanctuary. We provide the infrastructure, the security, and the clinical tools. You provide the brilliance.
              </p>
              <button 
                onClick={() => navigate('/verify')}
                className="px-16 py-6 rounded-3xl clinical-gradient text-[#050A0F] font-black text-xs uppercase tracking-[0.3em] shadow-3xl shadow-[#C8A96E]/20 hover:scale-105 active:scale-95 transition-all"
              >
                 Submit Application
              </button>
           </div>
           
           <div className="relative group shrink-0">
              <div className="absolute inset-0 bg-[#30B0D0]/20 blur-[100px] scale-150 group-hover:scale-110 transition-transform duration-1000" />
              <div className="size-72 rounded-[4rem] clinical-gradient flex items-center justify-center relative z-10 shadow-3xl rotate-12 group-hover:rotate-0 transition-transform duration-700">
                 <Bot className="w-32 h-32 text-white/90 animate-float" />
              </div>
           </div>
        </section>
      </main>
      
      <footer className="py-20 px-12 border-t border-white/5 bg-black/20 text-center">
         <div className="max-w-7xl mx-auto flex flex-col items-center gap-10">
            <span className="font-serif-clinical text-3xl font-bold tracking-tighter bg-gradient-to-r from-[#30B0D0] to-[#C8A96E] bg-clip-text text-transparent">URKIO</span>
            <div className="flex flex-wrap justify-center gap-12">
               {['Protocols', 'Privacy', 'Network', 'Support'].map(l => (
                  <a key={l} href="#" className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 hover:opacity-100 hover:text-[#30B0D0] transition-all">{l}</a>
               ))}
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-20">© 2026 URKIO CLINICAL. ALL RIGHTS SECURED.</p>
         </div>
      </footer>
    </div>
  );
}
