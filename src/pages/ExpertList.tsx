import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, Calendar, Heart, BadgeCheck, Settings, HelpCircle, 
  Star, ChevronRight, Filter, MessageSquare, Briefcase, Award,
  Clock, DollarSign, ExternalLink, ShieldCheck, Phone, Zap
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { AvatarWithBadges } from '../components/UserBadges';
import clsx from 'clsx';

export function ExpertList({ user, userData }: { user: any; userData: any }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const q = query(collection(db, 'users'), limit(100));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filter for experts/specialists
        const filtered = all.filter((u: any) => {
          if (u.isDeleted) return false;
          
          const email = (u.email || '').toLowerCase();
          const name = (u.displayName || '').toLowerCase();
          
          // Policy: Founder and Dr Sara Ghassan are perpetual experts
          const isFounder = email === 'urkio@urkio.com';
          const isDrSara = name.includes('sara ghassan');
          
          if (isFounder || isDrSara) return true;

          // Policy: New experts only if manually approved by the board
          return u.verificationStatus === 'approved';
        });
        setExperts(filtered);
      } catch (err) {
        console.error("Error fetching experts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, []);

  const filteredExperts = experts.filter(e => {
    const roleContent = (e.specialty || e.primaryRole || e.specialization || '').toLowerCase();
    const nameMatch = (e.displayName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = roleContent.includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || roleContent.includes(selectedCategory.toLowerCase());
    return (nameMatch || roleMatch) && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e1e2ea] font-['Manrope'] selection:bg-[#a8c8ff]/30">
      
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#a8c8ff]/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#c3c0ff]/5 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section - Marketplace Style */}
      <section className="relative pt-3 pb-5 px-4 overflow-hidden">
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-4 mb-6">
            <div className="max-w-2xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a8c8ff]/10 border border-[#a8c8ff]/20 text-[#a8c8ff] text-[8px] font-black uppercase tracking-[0.3em] mb-5 shadow-[0_0_20px_rgba(168,200,255,0.1)]">
                 <span className="size-2 rounded-full bg-[#a8c8ff] animate-ping" />
                 Global Healing Syndicate
               </div>
               <h1 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                 Elite <span className="text-transparent bg-clip-text bg-linear-to-r from-[#a8c8ff] via-msgr-primary-container to-[#c3c0ff]">Synergy</span> for Harmony.
               </h1>
               <p className="text-[10px] text-[#8b919e] font-medium">
                 Access an exclusive network of verified practitioners dedicating clinical brilliance to your transformation.
               </p>
            </div>
            
            <div className="hidden lg:block shrink-0">
               <div className="size-20 rounded-full border border-white/10 flex items-center justify-center relative group">
                  <div className="absolute inset-0 rounded-full border border-[#a8c8ff]/20 animate-[spin_8s_linear_infinite]" />
                  <Heart className="size-6 text-[#a8c8ff] group-hover:scale-110 transition-transform duration-500" />
               </div>
            </div>
          </div>

          {/* Search Bento - Integrated & Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 max-w-2xl">
            <div className="md:col-span-8 relative group">
              <div className="absolute inset-0 bg-[#a8c8ff]/10 rounded-xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="relative bg-[#161920]/40 backdrop-blur-3xl border border-white/5 rounded-xl p-0.5 flex items-center shadow-2xl transition-all group-hover:border-[#a8c8ff]/20">
                <div className="size-6 rounded-lg bg-[#a8c8ff]/10 flex items-center justify-center ms-2 shrink-0 transition-transform group-focus-within:scale-95">
                  <Search className="size-3 text-[#a8c8ff]" />
                </div>
                <input 
                  type="text" 
                  placeholder="Scan directory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none py-1.5 px-2 focus:ring-0 text-white text-[10px] font-bold placeholder-[#414752] outline-none"
                />
              </div>
            </div>
            <div className="md:col-span-4 h-full">
              <button 
                onClick={() => searchQuery ? setSelectedCategory('All') : null}
                className="w-full h-full bg-linear-to-tr from-[#a8c8ff] to-msgr-primary-container text-[#003062] rounded-xl font-black uppercase tracking-widest text-[7px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all py-2 md:py-0 flex items-center justify-center gap-1.5"
              >
                <Zap className="size-2.5 fill-current" />
                Execute Filter
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 -mt-10 relative z-20">
         {/* Trust Protocol Grid */}
         <div className="grid grid-cols-2 md:grid-cols-3 gap-2 lg:gap-4">
            {[
              { icon: BadgeCheck, val: '500+', label: 'Verified Clinical Experts', color: 'text-[#a8c8ff]' },
              { icon: Star, val: '4.95', label: 'Average Syndicate Rating', color: 'text-[#c3c0ff]' },
              { icon: ShieldCheck, val: '100%', label: 'Encrypted Privacy Protocol', color: 'text-emerald-400' }
            ].map((stat, i) => (
              <div key={i} className="bg-[#161920]/80 backdrop-blur-2xl border border-white/5 rounded-xl p-2 md:p-3 shadow-2xl flex items-center gap-2 md:gap-3 group hover:border-[#a8c8ff]/30 transition-all duration-500">
                <div className={clsx("size-8 md:size-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500", stat.color)}>
                  <stat.icon className="size-4 md:size-5" />
                </div>
                <div>
                  <h4 className="text-sm md:text-lg font-black text-white italic leading-none mb-0.5">{stat.val}</h4>
                  <p className="text-[6px] md:text-[7px] font-black uppercase tracking-[0.2em] text-[#8b919e]">{stat.label}</p>
                </div>
              </div>
            ))}
         </div>

         {/* Main Marketplace Layout */}
         <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6 pb-20">
            
            {/* Navigational Refinement */}
            <aside className="xl:col-span-2">
               <div className="bg-[#161920]/50 backdrop-blur-xl border border-white/5 rounded-xl p-3 sticky top-20 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="size-2.5 text-[#a8c8ff]" />
                    <h3 className="text-[10px] font-black italic text-white uppercase tracking-wider">Refine Axis</h3>
                  </div>
                  
                  <div className="space-y-3">
                     <div>
                        <label className="text-[8px] font-black uppercase tracking-[0.3em] text-[#414752] block mb-2">Expertise Vertical</label>
                        <div className="space-y-1">
                           {['All', 'Clinical Therapy', 'Nutrition', 'Biohacking', 'Spiritual', 'Performance'].map((cat) => (
                             <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={clsx(
                                  "w-full text-start px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                  selectedCategory === cat ? "bg-[#a8c8ff] text-[#003062]" : "bg-white/5 text-[#8b919e] hover:bg-white/10 hover:text-white"
                                )}
                             >
                               {cat}
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </aside>

            {/* Expert Nexus */}
            <section className="xl:col-span-10 space-y-3">
               {loading ? (
                   <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                   {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                     <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse border border-white/5" />
                   ))}
                 </div>
               ) : (
                  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                    {filteredExperts.map((expert) => (
                      <div 
                        key={expert.id}
                        onClick={() => navigate(`/user/${expert.id}`)}
                        className="group bg-[#22242c] rounded-xl overflow-hidden transition-all duration-500 cursor-pointer flex flex-col shadow-2xl hover:-translate-y-1 hover:shadow-3xl border border-white/5"
                      >
                         {/* Card Header: Edge-to-edge Image */}
                         <div className="relative h-28 md:h-32 overflow-hidden rounded-xl mb-1">
                           <img 
                             src={expert.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName || 'Expert')}&background=random&color=fff&size=512`}
                             alt={expert.displayName}
                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                           />
                           <div className="absolute bottom-2 right-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                             <Star className="size-2 fill-amber-400 text-amber-400" />
                             <span className="text-[8px] font-black text-white">{expert.rating || '4.9'}</span>
                           </div>
                         </div>

                          {/* Card Body */}
                         <div className="p-2 flex flex-col flex-1">
                            <h3 className="text-[10px] md:text-xs font-bold text-white tracking-tight line-clamp-1">
                                 {expert.displayName || "Elite Practitioner"}
                            </h3>
                            <p className="text-[8px] font-semibold text-[#a8c8ff] mb-2 truncate">
                               {expert.specialty || expert.primaryRole || "Psychologist"}
                            </p>
                            
                            <div className="mt-auto flex gap-1">
                               <button onClick={(e) => { e.stopPropagation(); navigate(`/user/${expert.id}`) }} className="flex-1 bg-[#b0cfff] text-[#122b5e] rounded-md py-1 text-[7px] font-black uppercase tracking-widest text-center">BOOK</button>
                               <button onClick={(e) => { e.stopPropagation(); navigate(`/messenger`) }} className="flex-1 bg-[#2f313a] text-white rounded-md py-1 text-[7px] font-black uppercase tracking-widest text-center">MSG</button>
                               {(expert.resumeUrl || expert.credentialUrl) && (
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); window.open(expert.resumeUrl || expert.credentialUrl, '_blank') }} 
                                   className="flex-1 bg-white/10 text-[#a8c8ff] rounded-md py-1 text-[7px] font-black uppercase tracking-widest text-center border border-[#a8c8ff]/20"
                                 >
                                   CV
                                 </button>
                               )}
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}

               {/* Elite Application Banner */}
               <div className="bg-[#161920] border border-white/10 rounded-4xl p-6 overflow-hidden relative group shadow-2xl mt-8">
                  <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                     <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c3c0ff]/10 border border-[#c3c0ff]/20 text-[#c3c0ff] text-[8px] font-black uppercase tracking-[0.25em] mb-2">
                          Syndicate Recruitment
                        </div>

                        <p className="text-[#8b919e] text-sm font-medium leading-relaxed mb-6 max-w-lg">
                          We are actively seeking world-class practitioners to join our elite healing sanctuary. Apply for clinical verification and expand your reach.
                        </p>
                        <button 
                          onClick={() => navigate('/verify')}
                          className="px-8 py-3 bg-[#a8c8ff] text-[#003062] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#a8c8ff]/20"
                        >
                           Submit Application
                        </button>
                     </div>
                     <div className="relative">
                        <div className="absolute inset-0 bg-[#a8c8ff]/20 rounded-full blur-3xl scale-110 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="size-40 rounded-4xl bg-linear-to-tr from-[#a8c8ff] to-msgr-primary-container flex items-center justify-center rotate-6 group-hover:rotate-0 transition-transform duration-700 relative z-10 shadow-3xl">
                           <Award className="size-20 text-white/90" />
                        </div>
                     </div>
                  </div>
               </div>
            </section>
         </div>
      </div>
    </div>
  );
}
